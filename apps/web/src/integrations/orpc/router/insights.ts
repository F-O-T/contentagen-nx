import { ORPCError } from "@orpc/server";
import { computeInsightData } from "@packages/analytics/compute-insight";
import { insightConfigSchema } from "@packages/analytics/types";
import { getDashboardById } from "@packages/database/repositories/dashboard-repository";
import {
   createInsight,
   deleteInsight,
   getInsightById,
   listInsightsByTeam,
   updateInsight,
} from "@packages/database/repositories/insight-repository";
import { insights } from "@packages/database/schemas/insights";
import { createEmitFn } from "@packages/events/emit";
import {
   emitInsightCreated,
   emitInsightDeleted,
   emitInsightUpdated,
} from "@packages/events/insight";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure } from "../server";

const createInsightSchema = z.object({
   name: z.string().min(1),
   description: z.string().optional(),
   type: z.enum(["trends", "funnels", "retention"]),
   config: insightConfigSchema,
   defaultSize: z.enum(["sm", "md", "lg", "full"]).optional().default("md"),
});

const updateInsightSchema = z.object({
   id: z.string().uuid(),
   name: z.string().min(1).optional(),
   description: z.string().optional(),
   config: insightConfigSchema.optional(),
   defaultSize: z.enum(["sm", "md", "lg", "full"]).optional(),
});

export const create = protectedProcedure
   .input(createInsightSchema)
   .handler(async ({ context, input }) => {
      const { organizationId, userId, db, posthog, teamId } = context;

      const insight = await createInsight(db, {
         organizationId,
         teamId,
         createdBy: userId,
         name: input.name,
         description: input.description,
         type: input.type,
         config: input.config,
         defaultSize: input.defaultSize,
      });

      try {
         await emitInsightCreated(
            createEmitFn(db, posthog),
            { organizationId, userId, teamId },
            { insightId: insight.id, name: input.name },
         );
      } catch {
         // Event emission must not break the main flow
      }

      return insight;
   });

export const list = protectedProcedure
   .input(
      z
         .object({
            type: z.enum(["trends", "funnels", "retention"]).optional(),
         })
         .optional(),
   )
   .handler(async ({ context, input }) => {
      const { teamId, db } = context;
      return await listInsightsByTeam(db, teamId, input?.type);
   });

export const getById = protectedProcedure
   .input(z.object({ id: z.string().uuid() }))
   .handler(async ({ context, input }) => {
      const { organizationId, teamId, db } = context;
      const insight = await getInsightById(db, input.id);

      if (
         !insight ||
         insight.organizationId !== organizationId ||
         insight.teamId !== teamId
      ) {
         throw new ORPCError("NOT_FOUND", {
            message: "Insight not found.",
         });
      }

      return insight;
   });

export const update = protectedProcedure
   .input(updateInsightSchema)
   .handler(async ({ context, input }) => {
      const { organizationId, db, posthog, userId, teamId } = context;
      const insight = await getInsightById(db, input.id);

      if (
         !insight ||
         insight.organizationId !== organizationId ||
         insight.teamId !== teamId
      ) {
         throw new ORPCError("NOT_FOUND", {
            message: "Insight not found.",
         });
      }

      const { id: _, ...updateData } = input;
      const updated = await updateInsight(db, input.id, updateData);

      try {
         const changedFields = Object.keys(updateData).filter(
            (k) => updateData[k as keyof typeof updateData] !== undefined,
         );
         await emitInsightUpdated(
            createEmitFn(db, posthog),
            { organizationId, userId, teamId },
            { insightId: input.id, changedFields },
         );
      } catch {
         // Event emission must not break the main flow
      }

      return updated;
   });

export const remove = protectedProcedure
   .input(z.object({ id: z.string().uuid() }))
   .handler(async ({ context, input }) => {
      const { organizationId, db, posthog, userId, teamId } = context;
      const insight = await getInsightById(db, input.id);

      if (
         !insight ||
         insight.organizationId !== organizationId ||
         insight.teamId !== teamId
      ) {
         throw new ORPCError("NOT_FOUND", {
            message: "Insight not found.",
         });
      }

      await deleteInsight(db, input.id);

      try {
         await emitInsightDeleted(
            createEmitFn(db, posthog),
            { organizationId, userId, teamId },
            { insightId: input.id },
         );
      } catch {
         // Event emission must not break the main flow
      }

      return { success: true };
   });

/**
 * Refresh cached results for all insights on a specific dashboard.
 * This is triggered manually by the user via the dashboard refresh button.
 */
export const refreshDashboard = protectedProcedure
   .input(z.object({ dashboardId: z.string().uuid() }))
   .handler(async ({ context, input }) => {
      const { organizationId, teamId, db } = context;

      // Verify dashboard ownership
      const dashboard = await getDashboardById(db, input.dashboardId);

      if (
         !dashboard ||
         dashboard.organizationId !== organizationId ||
         dashboard.teamId !== teamId
      ) {
         throw new ORPCError("NOT_FOUND", {
            message: "Dashboard not found.",
         });
      }

      // Extract unique insight IDs from dashboard tiles
      const insightIds = [
         ...new Set(dashboard.tiles.map((tile) => tile.insightId)),
      ];

      // Refresh each insight's cached data in parallel
      const refreshPromises = insightIds.map(async (insightId) => {
         try {
            const insight = await getInsightById(db, insightId);
            if (!insight) {
               console.warn(
                  `[Insights] Insight ${insightId} not found during refresh`,
               );
               return;
            }

            const freshData = await computeInsightData(db, insight);

            await db
               .update(insights)
               .set({
                  cachedResults: freshData,
                  lastComputedAt: new Date(),
               })
               .where(eq(insights.id, insightId));
         } catch (error) {
            console.error(
               `[Insights] Failed to refresh insight ${insightId}:`,
               error,
            );
            // Continue with other insights even if one fails
         }
      });

      await Promise.all(refreshPromises);

      return {
         success: true,
         refreshedCount: insightIds.length,
      };
   });
