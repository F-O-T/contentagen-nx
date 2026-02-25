import { ORPCError } from "@orpc/server";
import {
   createFolder,
   deleteFolder,
   getFolderById,
   listFoldersWithChildren,
   updateFolder,
} from "@packages/database/repositories/folder-repository";
import { z } from "zod";
import { protectedProcedure } from "../server";
import { getDashboardById, updateDashboard } from "@packages/database/repositories/dashboard-repository";
import { getInsightById, updateInsight } from "@packages/database/repositories/insight-repository";

const createFolderSchema = z.object({
   name: z.string().min(1),
   description: z.string().optional(),
   parentId: z.string().uuid().nullable().optional(),
   order: z.number().int().optional(),
   color: z.string().optional(),
});

const updateFolderSchema = z.object({
   id: z.string().uuid(),
   name: z.string().min(1).optional(),
   description: z.string().optional(),
   parentId: z.string().uuid().nullable().optional(),
   order: z.number().int().optional(),
   color: z.string().optional(),
});

const moveItemSchema = z.object({
   resourceType: z.enum(["dashboard", "insight"]),
   resourceId: z.string().uuid(),
   folderId: z.string().uuid().nullable(),
});

export const create = protectedProcedure
   .input(createFolderSchema)
   .handler(async ({ context, input }) => {
      const { organizationId, userId, db, teamId } = context;

      const folder = await createFolder(db, {
         organizationId,
         teamId,
         createdBy: userId,
         name: input.name,
         description: input.description ?? null,
         parentId: input.parentId ?? null,
         order: input.order ?? 0,
         color: input.color ?? null,
      });

      return folder;
   });

export const list = protectedProcedure
   .input(z.object({ teamId: z.string().uuid() }))
   .handler(async ({ context, input }) => {
      const { teamId, db } = context;

      if (input.teamId !== teamId) {
         throw new ORPCError("FORBIDDEN", {
            message: "Cannot list folders for another team",
         });
      }

      return await listFoldersWithChildren(db, teamId);
   });

export const update = protectedProcedure
   .input(updateFolderSchema)
   .handler(async ({ context, input }) => {
      const { organizationId, teamId, db } = context;
      const folder = await getFolderById(db, input.id);

      if (
         !folder ||
         folder.organizationId !== organizationId ||
         folder.teamId !== teamId
      ) {
         throw new ORPCError("NOT_FOUND", { message: "Folder not found" });
      }

      const { id: _, ...data } = input;
      const updated = await updateFolder(db, input.id, data);
      if (!updated) {
         throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message: "Failed to update folder",
         });
      }
      return updated;
   });

export const remove = protectedProcedure
   .input(z.object({ id: z.string().uuid() }))
   .handler(async ({ context, input }) => {
      const { organizationId, teamId, db } = context;
      const folder = await getFolderById(db, input.id);

      if (
         !folder ||
         folder.organizationId !== organizationId ||
         folder.teamId !== teamId
      ) {
         throw new ORPCError("NOT_FOUND", { message: "Folder not found" });
      }

      await deleteFolder(db, input.id);
      return { success: true };
   });

export const moveItem = protectedProcedure
   .input(moveItemSchema)
   .handler(async ({ context, input }) => {
      const { organizationId, teamId, db } = context;

      if (input.folderId != null) {
         const folder = await getFolderById(db, input.folderId);
         if (
            !folder ||
            folder.organizationId !== organizationId ||
            folder.teamId !== teamId
         ) {
            throw new ORPCError("NOT_FOUND", { message: "Folder not found" });
         }
      }

      if (input.resourceType === "dashboard") {
         const dashboard = await getDashboardById(db, input.resourceId);
         if (
            !dashboard ||
            dashboard.organizationId !== organizationId ||
            dashboard.teamId !== teamId
         ) {
            throw new ORPCError("NOT_FOUND", {
               message: "Dashboard not found",
            });
         }
         const updated = await updateDashboard(db, input.resourceId, {
            folderId: input.folderId,
         });
         if (!updated) {
            throw new ORPCError("INTERNAL_SERVER_ERROR", {
               message: "Failed to move dashboard",
            });
         }
         return updated;
      }

      const insight = await getInsightById(db, input.resourceId);
      if (
         !insight ||
         insight.organizationId !== organizationId ||
         insight.teamId !== teamId
      ) {
         throw new ORPCError("NOT_FOUND", {
            message: "Insight not found",
         });
      }
      const updated = await updateInsight(db, input.resourceId, {
         folderId: input.folderId,
      });
      if (!updated) {
         throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message: "Failed to move insight",
         });
      }
      return updated;
   });
