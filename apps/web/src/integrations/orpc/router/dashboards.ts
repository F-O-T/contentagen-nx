import { ORPCError } from "@orpc/server";
import {
   createDashboard,
   deleteDashboard,
   getDashboardById,
   listDashboardsByTeam,
   setDashboardAsHome,
   updateDashboard,
   updateDashboardTiles,
} from "@packages/database/repositories/dashboard-repository";
import {
   DashboardDateRangeSchema,
   DashboardFilterSchema,
   type NewDashboard,
} from "@packages/database/schemas/dashboards";
import {
   emitDashboardCreated,
   emitDashboardDeleted,
   emitDashboardUpdated,
} from "@packages/events/dashboard";
import { createEmitFn } from "@packages/events/emit";
import { z } from "zod";
import { protectedProcedure } from "../server";

const tileSchema = z.object({
   insightId: z.string().uuid(),
   size: z.enum(["sm", "md", "lg", "full"]),
   order: z.number().int().min(0),
});

const createDashboardSchema = z.object({
   name: z.string().min(1),
   description: z.string().optional(),
});

const updateDashboardSchema = z.object({
   id: z.string().uuid(),
   name: z.string().min(1).optional(),
   description: z.string().optional(),
});

const updateTilesSchema = z.object({
   id: z.string().uuid(),
   name: z.string().min(1).optional(),
   description: z.string().optional(),
   tiles: z.array(tileSchema).optional(),
});

export const create = protectedProcedure
   .input(createDashboardSchema)
   .handler(async ({ context, input }) => {
      const { organizationId, userId, db, posthog, teamId } = context;

      const dashboard = await createDashboard(db, {
         organizationId,
         teamId,
         createdBy: userId,
         name: input.name,
         description: input.description,
      });

      try {
         await emitDashboardCreated(
            createEmitFn(db, posthog),
            { organizationId, userId, teamId },
            { dashboardId: dashboard.id, name: input.name },
         );
      } catch {
         // Event emission must not break the main flow
      }

      return dashboard;
   });

export const list = protectedProcedure.handler(async ({ context }) => {
   const { teamId, db } = context;
   return await listDashboardsByTeam(db, teamId);
});

export const getById = protectedProcedure
   .input(z.object({ id: z.string().uuid() }))
   .handler(async ({ context, input }) => {
      const { organizationId, teamId, db } = context;
      const dashboard = await getDashboardById(db, input.id);

      if (
         !dashboard ||
         dashboard.organizationId !== organizationId ||
         dashboard.teamId !== teamId
      ) {
         throw new ORPCError("NOT_FOUND", {
            message: "Dashboard not found.",
         });
      }

      return dashboard;
   });

export const update = protectedProcedure
   .input(updateDashboardSchema)
   .handler(async ({ context, input }) => {
      const { organizationId, db, posthog, userId, teamId } = context;
      const dashboard = await getDashboardById(db, input.id);

      if (
         !dashboard ||
         dashboard.organizationId !== organizationId ||
         dashboard.teamId !== teamId
      ) {
         throw new ORPCError("NOT_FOUND", {
            message: "Dashboard not found.",
         });
      }

      const { id: _, ...updateData } = input;
      const updated = await updateDashboard(db, input.id, updateData);

      try {
         const changedFields = Object.keys(updateData).filter(
            (k) => updateData[k as keyof typeof updateData] !== undefined,
         );
         await emitDashboardUpdated(
            createEmitFn(db, posthog),
            { organizationId, userId, teamId },
            { dashboardId: input.id, changedFields },
         );
      } catch {
         // Event emission must not break the main flow
      }

      return updated;
   });

export const updateTiles = protectedProcedure
   .input(updateTilesSchema)
   .handler(async ({ context, input }) => {
      const { organizationId, teamId, db, posthog, userId } = context;
      const dashboard = await getDashboardById(db, input.id);

      if (
         !dashboard ||
         dashboard.organizationId !== organizationId ||
         dashboard.teamId !== teamId
      ) {
         throw new ORPCError("NOT_FOUND", {
            message: "Dashboard not found.",
         });
      }

      // Update tiles if provided
      if (input.tiles !== undefined) {
         await updateDashboardTiles(db, input.id, input.tiles);
      }

      // Update metadata if provided
      const metadataUpdate: { name?: string; description?: string } = {};
      if (input.name !== undefined) metadataUpdate.name = input.name;
      if (input.description !== undefined)
         metadataUpdate.description = input.description;

      if (Object.keys(metadataUpdate).length > 0) {
         await updateDashboard(db, input.id, metadataUpdate);

         try {
            const changedFields = Object.keys(metadataUpdate);
            await emitDashboardUpdated(
               createEmitFn(db, posthog),
               { organizationId, userId, teamId },
               { dashboardId: input.id, changedFields },
            );
         } catch {
            // Event emission must not break the main flow
         }
      }

      return await getDashboardById(db, input.id);
   });

export const remove = protectedProcedure
   .input(z.object({ id: z.string().uuid() }))
   .handler(async ({ context, input }) => {
      const { organizationId, db, posthog, userId, teamId } = context;
      const dashboard = await getDashboardById(db, input.id);

      if (
         !dashboard ||
         dashboard.organizationId !== organizationId ||
         dashboard.teamId !== teamId
      ) {
         throw new ORPCError("NOT_FOUND", {
            message: "Dashboard not found.",
         });
      }

      try {
         await deleteDashboard(db, input.id);
      } catch (err) {
         if (err instanceof Error && err.message.includes("home dashboard")) {
            throw new ORPCError("BAD_REQUEST", {
               message: err.message,
            });
         }
         throw err;
      }

      try {
         await emitDashboardDeleted(
            createEmitFn(db, posthog),
            { organizationId, userId, teamId },
            { dashboardId: input.id },
         );
      } catch {
         // Event emission must not break the main flow
      }

      return { success: true };
   });

export const updateGlobalFilters = protectedProcedure
   .input(
      z.object({
         dashboardId: z.string().uuid(),
         globalDateRange: DashboardDateRangeSchema.nullable().optional(),
         globalFilters: z.array(DashboardFilterSchema).optional(),
      }),
   )
   .handler(async ({ context, input }) => {
      const { organizationId, teamId, db, posthog, userId } = context;

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

      // Build update object
      const updateData: Parameters<typeof updateDashboard>[2] &
         Partial<Pick<NewDashboard, "globalDateRange" | "globalFilters">> = {};

      if (input.globalDateRange !== undefined) {
         updateData.globalDateRange = input.globalDateRange;
      }

      if (input.globalFilters !== undefined) {
         updateData.globalFilters = input.globalFilters;
      }

      // Update dashboard
      const updated = await updateDashboard(db, input.dashboardId, updateData);

      try {
         const changedFields = Object.keys(updateData);
         await emitDashboardUpdated(
            createEmitFn(db, posthog),
            { organizationId, userId, teamId },
            { dashboardId: input.dashboardId, changedFields },
         );
      } catch {
         // Event emission must not break the main flow
      }

      return updated;
   });

export const setAsHome = protectedProcedure
   .input(z.object({ id: z.string().uuid() }))
   .handler(async ({ context, input }) => {
      const { organizationId, teamId, db, posthog, userId } = context;

      const dashboard = await getDashboardById(db, input.id);

      if (
         !dashboard ||
         dashboard.organizationId !== organizationId ||
         dashboard.teamId !== teamId
      ) {
         throw new ORPCError("NOT_FOUND", {
            message: "Dashboard not found.",
         });
      }

      if (dashboard.isDefault) {
         return dashboard;
      }

      const updated = await setDashboardAsHome(db, input.id, teamId);

      try {
         await emitDashboardUpdated(
            createEmitFn(db, posthog),
            { organizationId, userId, teamId },
            { dashboardId: input.id, changedFields: ["isDefault"] },
         );
      } catch {
         // Event emission must not break the main flow
      }

      return updated;
   });
