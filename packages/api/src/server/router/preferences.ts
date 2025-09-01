import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import {
   createUserPreference,
   getUserPreferences,
   getWorkflowPreferences,
   updateUserPreference,
   updateWorkflowPreferences,
   deleteUserPreferenceByKey,
} from "@packages/database/repositories/user-preferences-repository";
import { listAgents } from "@packages/database/repositories/agent-repository";
import { listContents } from "@packages/database/repositories/content-repository";
import type { WorkflowPreferences } from "@packages/database/schemas/user-preferences";

export const preferencesRouter = router({
   // Get all user preferences
   getAll: protectedProcedure.query(async ({ ctx }) => {
      try {
         const resolvedCtx = await ctx;
         const userId = resolvedCtx.session?.user.id;
         if (!userId) {
            throw new TRPCError({
               code: "UNAUTHORIZED",
               message: "User must be authenticated to get preferences.",
            });
         }
         return await getUserPreferences(resolvedCtx.db, userId);
      } catch (err) {
         throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to get user preferences.",
         });
      }
   }),

   // Update workflow preferences
   updateWorkflow: protectedProcedure
      .input(
         z.object({
            notifyMissingImages: z.boolean().optional(),
         }),
      )
      .mutation(async ({ ctx, input }) => {
         try {
            const resolvedCtx = await ctx;
            const userId = resolvedCtx.session?.user.id;
            if (!userId) {
               throw new TRPCError({
                  code: "UNAUTHORIZED",
                  message:
                     "User must be authenticated to update workflow preferences.",
               });
            }

            // Get current workflow preferences
            const currentPrefs = (await getWorkflowPreferences(
               resolvedCtx.db,
               userId,
            )) || {
               notifyMissingImages: false,
            };

            // Update with new values
            const updatedPrefs: WorkflowPreferences = {
               ...currentPrefs,
               ...input,
            };

            await updateWorkflowPreferences(
               resolvedCtx.db,
               userId,
               updatedPrefs,
            );

            return { success: true };
         } catch (err) {
            throw new TRPCError({
               code: "INTERNAL_SERVER_ERROR",
               message: "Failed to update workflow preferences.",
            });
         }
      }),

   // Update a user preference (legacy)
   update: protectedProcedure
      .input(
         z.object({
            category: z.enum(["global_writing_style", "workflow"]),
            key: z.string().optional(),
            value: z.union([z.string(), z.boolean()]),
         }),
      )
      .mutation(async ({ ctx, input }) => {
         try {
            const resolvedCtx = await ctx;
            const userId = resolvedCtx.session?.user.id;
            if (!userId) {
               throw new TRPCError({
                  code: "UNAUTHORIZED",
                  message: "User must be authenticated to update preferences.",
               });
            }

            if (input.category === "workflow") {
               // For workflow preferences, use the new structured approach
               const currentPrefs = (await getWorkflowPreferences(
                  resolvedCtx.db,
                  userId,
               )) || {
                  notifyMissingImages: false,
               };

               const updatedPrefs: WorkflowPreferences = {
                  ...currentPrefs,
                  notifyMissingImages: input.value as boolean,
               };

               await updateWorkflowPreferences(
                  resolvedCtx.db,
                  userId,
                  updatedPrefs,
               );
            } else {
               // Legacy behavior for other categories
               const existingPreferences = await getUserPreferences(
                  resolvedCtx.db,
                  userId,
               );
               const existingPref = existingPreferences.find(
                  (pref) => pref.category === input.category && !pref.key,
               );

               if (existingPref) {
                  await updateUserPreference(resolvedCtx.db, existingPref.id, {
                     value: input.value,
                  });
               } else {
                  await createUserPreference(resolvedCtx.db, {
                     userId,
                     category: input.category,
                     value: input.value,
                  });
               }
            }

            return { success: true };
         } catch (err) {
            throw new TRPCError({
               code: "INTERNAL_SERVER_ERROR",
               message: "Failed to update user preference.",
            });
         }
      }),

   // Create a new workflow preference
   createWorkflow: protectedProcedure
      .input(
         z.object({
            key: z.string(),
            value: z.union([z.string(), z.boolean()]),
         }),
      )
      .mutation(async ({ ctx, input }) => {
         try {
            const resolvedCtx = await ctx;
            const userId = resolvedCtx.session?.user.id;
            if (!userId) {
               throw new TRPCError({
                  code: "UNAUTHORIZED",
                  message: "User must be authenticated to create preferences.",
               });
            }

            const result = await createUserPreference(resolvedCtx.db, {
               userId,
               category: "workflow",
               key: input.key,
               value: input.value,
            });

            return result;
         } catch (err) {
            throw new TRPCError({
               code: "INTERNAL_SERVER_ERROR",
               message: "Failed to create workflow preference.",
            });
         }
      }),

   // Delete a workflow preference
   deleteWorkflow: protectedProcedure
      .input(z.object({ key: z.string() }))
      .mutation(async ({ ctx, input }) => {
         try {
            const resolvedCtx = await ctx;
            const userId = resolvedCtx.session?.user.id;
            if (!userId) {
               throw new TRPCError({
                  code: "UNAUTHORIZED",
                  message: "User must be authenticated to delete preferences.",
               });
            }

            await deleteUserPreferenceByKey(
               resolvedCtx.db,
               userId,
               "workflow",
               input.key,
            );

            return { success: true };
         } catch (err) {
            throw new TRPCError({
               code: "INTERNAL_SERVER_ERROR",
               message: "Failed to delete workflow preference.",
            });
         }
      }),

   // Check for posts missing image URLs
   checkMissingImages: protectedProcedure.query(async ({ ctx }) => {
      try {
         const resolvedCtx = await ctx;
         const userId = resolvedCtx.session?.user.id;
         const organizationId =
            resolvedCtx.session?.session?.activeOrganizationId;

         if (!userId) {
            throw new TRPCError({
               code: "UNAUTHORIZED",
               message: "User must be authenticated to check missing images.",
            });
         }

         // Get all agents belonging to the user
         const agents = await listAgents(resolvedCtx.db, {
            userId,
            organizationId: organizationId ?? "",
         });

         if (agents.length === 0) {
            return { missingImages: [], total: 0 };
         }

         const agentIds = agents.map((agent) => agent.id);

         // Get all content for these agents that might be missing images
         const allContent = await listContents(
            resolvedCtx.db,
            agentIds,
            ["approved", "draft"], // Only check approved and draft content
         );

         // Filter content that has no imageUrl or empty imageUrl
         const missingImages = allContent.filter(
            (item) => !item.imageUrl || item.imageUrl.trim() === "",
         );

         return {
            missingImages: missingImages.map((item) => ({
               id: item.id,
               title: item.meta?.title || "Untitled",
               agentName:
                  item.agent?.personaConfig?.metadata?.name || "Unknown Agent",
               status: item.status,
            })),
            total: missingImages.length,
         };
      } catch (err) {
         throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to check for missing images.",
         });
      }
   }),

   // Get workflow preferences
   getWorkflow: protectedProcedure.query(async ({ ctx }) => {
      try {
         const resolvedCtx = await ctx;
         const userId = resolvedCtx.session?.user.id;
         if (!userId) {
            throw new TRPCError({
               code: "UNAUTHORIZED",
               message:
                  "User must be authenticated to get workflow preferences.",
            });
         }

         const workflowPrefs = await getWorkflowPreferences(
            resolvedCtx.db,
            userId,
         );

         return {
            preferences: workflowPrefs || { notifyMissingImages: false },
            notifyMissingImages: workflowPrefs?.notifyMissingImages ?? false,
         };
      } catch (err) {
         throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to get workflow preferences.",
         });
      }
   }),
});
