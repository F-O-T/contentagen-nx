import { ORPCError } from "@orpc/server";
import {
   addVariant,
   createExperiment,
   deleteExperiment,
   getExperimentById,
   getVariantsByExperiment,
   listExperimentsByTeam,
   removeVariant,
   updateExperiment,
} from "@packages/database/repositories/experiments-repository";
import { content } from "@packages/database/schemas/content";
import { experimentDailyStats } from "@packages/database/schemas/event-views";
import { experimentVariants } from "@packages/database/schemas/experiments";
import { forms } from "@packages/database/schemas/forms";
import { EXPERIMENT_TARGET_TYPES } from "@packages/events/experiments";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure } from "../server";

// =============================================================================
// Schemas
// =============================================================================

const createExperimentSchema = z.object({
   name: z.string().min(1),
   hypothesis: z.string().optional(),
   targetType: z.enum(EXPERIMENT_TARGET_TYPES),
   goal: z.enum(["conversion", "ctr", "time_on_page", "form_submit"]),
});

const updateExperimentSchema = z.object({
   id: z.string().uuid(),
   name: z.string().min(1).optional(),
   hypothesis: z.string().optional(),
   targetType: z.enum(EXPERIMENT_TARGET_TYPES).optional(),
   goal: z
      .enum(["conversion", "ctr", "time_on_page", "form_submit"])
      .optional(),
});

const addVariantSchema = z.object({
   experimentId: z.string().uuid(),
   name: z.string().min(1),
   isControl: z.boolean().default(false),
   contentId: z.string().uuid().optional(),
   formId: z.string().uuid().optional(),
});

// =============================================================================
// Procedures
// =============================================================================

export const list = protectedProcedure.handler(async ({ context }) => {
   const { db, teamId } = context;
   return listExperimentsByTeam(db, teamId);
});

export const getById = protectedProcedure
   .input(z.object({ id: z.string().uuid() }))
   .handler(async ({ context, input }) => {
      const { db, organizationId } = context;
      const experiment = await getExperimentById(db, input.id);
      if (!experiment || experiment.organizationId !== organizationId) {
         throw new ORPCError("NOT_FOUND", { message: "Experiment not found" });
      }
      return experiment;
   });

export const create = protectedProcedure
   .input(createExperimentSchema)
   .handler(async ({ context, input }) => {
      const { db, organizationId, teamId } = context;
      return createExperiment(db, {
         ...input,
         organizationId,
         teamId,
      });
   });

export const update = protectedProcedure
   .input(updateExperimentSchema)
   .handler(async ({ context, input }) => {
      const { db, organizationId } = context;
      const existing = await getExperimentById(db, input.id);
      if (!existing || existing.organizationId !== organizationId) {
         throw new ORPCError("NOT_FOUND", { message: "Experiment not found" });
      }
      const { id, ...data } = input;
      return updateExperiment(db, id, data);
   });

export const remove = protectedProcedure
   .input(z.object({ id: z.string().uuid() }))
   .handler(async ({ context, input }) => {
      const { db, organizationId } = context;
      const existing = await getExperimentById(db, input.id);
      if (!existing || existing.organizationId !== organizationId) {
         throw new ORPCError("NOT_FOUND", { message: "Experiment not found" });
      }
      if (existing.status === "running") {
         throw new ORPCError("FORBIDDEN", {
            message: "Cannot delete a running experiment. Pause it first.",
         });
      }
      await deleteExperiment(db, input.id);
      return { success: true };
   });

export const start = protectedProcedure
   .input(z.object({ id: z.string().uuid() }))
   .handler(async ({ context, input }) => {
      const { db, organizationId } = context;
      const existing = await getExperimentById(db, input.id);
      if (!existing || existing.organizationId !== organizationId) {
         throw new ORPCError("NOT_FOUND", { message: "Experiment not found" });
      }
      if (existing.status !== "draft" && existing.status !== "paused") {
         throw new ORPCError("FORBIDDEN", {
            message: "Only draft or paused experiments can be started",
         });
      }
      if (existing.variants.length < 2) {
         throw new ORPCError("FORBIDDEN", {
            message: "Experiment needs at least 2 variants to start",
         });
      }
      return updateExperiment(db, input.id, {
         status: "running",
         startedAt: existing.startedAt ?? new Date(),
      });
   });

export const pause = protectedProcedure
   .input(z.object({ id: z.string().uuid() }))
   .handler(async ({ context, input }) => {
      const { db, organizationId } = context;
      const existing = await getExperimentById(db, input.id);
      if (!existing || existing.organizationId !== organizationId) {
         throw new ORPCError("NOT_FOUND", { message: "Experiment not found" });
      }
      if (existing.status !== "running") {
         throw new ORPCError("FORBIDDEN", {
            message: "Only running experiments can be paused",
         });
      }
      return updateExperiment(db, input.id, { status: "paused" });
   });

export const conclude = protectedProcedure
   .input(
      z.object({
         id: z.string().uuid(),
         winnerId: z.string().uuid().optional(),
      }),
   )
   .handler(async ({ context, input }) => {
      const { db, organizationId } = context;
      const existing = await getExperimentById(db, input.id);
      if (!existing || existing.organizationId !== organizationId) {
         throw new ORPCError("NOT_FOUND", { message: "Experiment not found" });
      }
      if (existing.status === "concluded") {
         throw new ORPCError("FORBIDDEN", {
            message: "Experiment is already concluded",
         });
      }
      if (
         input.winnerId &&
         !existing.variants.some((v) => v.id === input.winnerId)
      ) {
         throw new ORPCError("UNPROCESSABLE_ENTITY", {
            message: "Winner must be a variant of this experiment",
         });
      }
      return updateExperiment(db, input.id, {
         status: "concluded",
         concludedAt: new Date(),
         winnerId: input.winnerId,
      });
   });

export const addVariantToExperiment = protectedProcedure
   .input(addVariantSchema)
   .handler(async ({ context, input }) => {
      const { db, organizationId } = context;
      const experiment = await getExperimentById(db, input.experimentId);
      if (!experiment || experiment.organizationId !== organizationId) {
         throw new ORPCError("NOT_FOUND", { message: "Experiment not found" });
      }
      if (experiment.status === "running") {
         throw new ORPCError("FORBIDDEN", {
            message: "Cannot add variants to a running experiment",
         });
      }

      // Validate targetType vs provided IDs
      if (experiment.targetType === "content") {
         if (!input.contentId || input.formId) {
            throw new ORPCError("BAD_REQUEST", {
               message:
                  "contentId is required and formId must not be set for content experiments",
            });
         }
         const [row] = await db
            .select({ id: content.id })
            .from(content)
            .where(
               and(
                  eq(content.id, input.contentId),
                  eq(content.organizationId, organizationId),
               ),
            )
            .limit(1);
         if (!row) {
            throw new ORPCError("NOT_FOUND", { message: "Content not found" });
         }
      } else if (experiment.targetType === "cluster") {
         throw new ORPCError("BAD_REQUEST", {
            message: "Cluster experiments are not yet supported",
         });
      } else if (experiment.targetType === "form") {
         if (!input.formId || input.contentId) {
            throw new ORPCError("BAD_REQUEST", {
               message:
                  "formId is required and contentId must not be set for form experiments",
            });
         }
         const [row] = await db
            .select({ id: forms.id })
            .from(forms)
            .where(
               and(
                  eq(forms.id, input.formId),
                  eq(forms.organizationId, organizationId),
               ),
            )
            .limit(1);
         if (!row) {
            throw new ORPCError("NOT_FOUND", { message: "Form not found" });
         }
      }

      return addVariant(db, input);
   });

export const removeVariantFromExperiment = protectedProcedure
   .input(z.object({ variantId: z.string().uuid() }))
   .handler(async ({ context, input }) => {
      const { db, organizationId } = context;
      // Verify ownership: fetch the variant's experiment and check org
      const [variant] = await db
         .select()
         .from(experimentVariants)
         .where(eq(experimentVariants.id, input.variantId))
         .limit(1);
      if (!variant) {
         throw new ORPCError("NOT_FOUND", { message: "Variant not found" });
      }
      const experiment = await getExperimentById(db, variant.experimentId);
      if (!experiment || experiment.organizationId !== organizationId) {
         throw new ORPCError("NOT_FOUND", { message: "Variant not found" });
      }
      if (experiment.status === "running") {
         throw new ORPCError("FORBIDDEN", {
            message: "Cannot remove variants from a running experiment",
         });
      }
      await removeVariant(db, input.variantId);
      return { success: true };
   });

export const getResults = protectedProcedure
   .input(z.object({ experimentId: z.string().uuid() }))
   .handler(async ({ context, input }) => {
      const { db, organizationId } = context;
      const experiment = await getExperimentById(db, input.experimentId);
      if (!experiment || experiment.organizationId !== organizationId) {
         throw new ORPCError("NOT_FOUND", { message: "Experiment not found" });
      }
      const variants = await getVariantsByExperiment(db, input.experimentId);

      const stats = await db
         .select()
         .from(experimentDailyStats)
         .where(
            and(
               eq(experimentDailyStats.organizationId, organizationId),
               eq(experimentDailyStats.experimentId, input.experimentId),
            ),
         );

      // Aggregate by variantId
      const byVariant = variants.map((v) => {
         const variantStats = stats.filter((s) => s.variantId === v.id);
         const totalImpressions = variantStats.reduce(
            (sum, s) => sum + s.impressions,
            0,
         );
         const totalConversions = variantStats.reduce(
            (sum, s) => sum + s.conversions,
            0,
         );
         const conversionRate =
            totalImpressions > 0 ? totalConversions / totalImpressions : 0;

         return {
            variant: v,
            totalImpressions,
            totalConversions,
            conversionRate,
            isWinner: experiment.winnerId === v.id,
            dailyStats: variantStats,
         };
      });

      return {
         experiment,
         variants: byVariant,
      };
   });
