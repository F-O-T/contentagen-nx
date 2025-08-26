import {
   createIdea,
   getIdeaById,
   updateIdea,
   deleteIdea,
   listIdeasByAgent,
} from "@packages/database/repositories/ideas-repository";
import {
   IdeaInsertSchema,
   IdeaUpdateSchema,
} from "@packages/database/schemas/ideas";
import { protectedProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { listAllIdeasPaginated } from "@packages/database/repositories/ideas-repository";

import { createContent } from "@packages/database/repositories/content-repository";
import { enqueueContentPlanningJob } from "@packages/workers/queues/content/content-planning-queue";

export const ideasRouter = router({
   listAllIdeas: protectedProcedure
      .input(
         z.object({
            page: z.number().min(1).default(1),
            limit: z.number().min(1).max(100).default(10),
         }),
      )
      .query(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         try {
            const all = await listAllIdeasPaginated(
               resolvedCtx.db,
               input.page,
               input.limit,
            );
            return all;
         } catch (err) {
            throw new TRPCError({
               code: "INTERNAL_SERVER_ERROR",
               message: (err as Error).message,
            });
         }
      }),
   create: protectedProcedure
      .input(
         IdeaInsertSchema.omit({ id: true, createdAt: true, updatedAt: true }),
      )
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         try {
            return await createIdea(resolvedCtx.db, input);
         } catch (err) {
            throw new TRPCError({
               code: "INTERNAL_SERVER_ERROR",
               message: (err as Error).message,
            });
         }
      }),

   get: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         try {
            // getIdeaById now throws if not found, so we simply return
            return await getIdeaById(resolvedCtx.db, input.id);
         } catch (err) {
            throw new TRPCError({
               code: "NOT_FOUND",
               message: (err as Error).message,
            });
         }
      }),
   getIdeaById: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         try {
            return await getIdeaById(resolvedCtx.db, input.id);
         } catch (err) {
            throw new TRPCError({
               code: "NOT_FOUND",
               message: (err as Error).message,
            });
         }
      }),

   update: protectedProcedure
      .input(
         IdeaUpdateSchema.pick({
            id: true,
            content: true,
            status: true,
            meta: true,
         }),
      )
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         if (!input.id) {
            throw new TRPCError({
               code: "BAD_REQUEST",
               message: "ID is required for update",
            });
         }
         try {
            return await updateIdea(resolvedCtx.db, input.id, input);
         } catch (err) {
            throw new TRPCError({
               code: "INTERNAL_SERVER_ERROR",
               message: (err as Error).message,
            });
         }
      }),

   delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         try {
            await deleteIdea(resolvedCtx.db, input.id);
            return { success: true };
         } catch (err) {
            throw new TRPCError({
               code: "INTERNAL_SERVER_ERROR",
               message: (err as Error).message,
            });
         }
      }),

   listByAgent: protectedProcedure
      .input(z.object({ agentId: z.string().min(1) }))
      .query(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         // listIdeasByAgent now returns an array directly
         return await listIdeasByAgent(resolvedCtx.db, input.agentId);
      }),

   approve: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const db = resolvedCtx.db;
         // 1. Fetch idea
         const idea = await getIdeaById(db, input.id);
         if (!idea) {
            throw new TRPCError({
               code: "NOT_FOUND",
               message: "Idea not found.",
            });
         }
         if (idea.status === "approved" || idea.status === "rejected") {
            throw new TRPCError({
               code: "BAD_REQUEST",
               message: "Idea already processed.",
            });
         }
         // 2. Update status
         await updateIdea(db, idea.id, { status: "approved" });
         // 3. Create content
         const content = await createContent(db, {
            agentId: idea.agentId,
            request: { description: idea.content },
         });
         // 4. Enqueue job
         await enqueueContentPlanningJob({
            agentId: idea.agentId,
            contentId: content.id,
            contentRequest: { description: idea.content },
         });
         return { success: true, content };
      }),
});
