import {
   createIdea,
   getIdeaById,
   updateIdea,
   deleteIdea,
   getAgentIdeasCount,
} from "@packages/database/repositories/ideas-repository";
import {
   IdeaInsertSchema,
   IdeaUpdateSchema,
} from "@packages/database/schemas/ideas";
import { protectedProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { ideas } from "@packages/database/schemas/ideas";

import { listAllIdeasPaginated } from "@packages/database/repositories/ideas-repository";
import { listAgents } from "@packages/database/repositories/agent-repository";

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
            const userId = resolvedCtx.session?.user.id;
            const organizationId =
               resolvedCtx.session?.session?.activeOrganizationId;
            if (!userId) {
               throw new TRPCError({
                  code: "UNAUTHORIZED",
                  message: "User must be authenticated to list ideas.",
               });
            }
            const agents = await listAgents(resolvedCtx.db, {
               userId,
               organizationId: organizationId ?? "",
            });
            const agentIds = agents.map((agent) => agent.id);
            if (agentIds.length === 0) return { items: [], total: 0 };
            const all = await listAllIdeasPaginated(
               resolvedCtx.db,
               input.page,
               input.limit,
               agentIds,
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
         const ideasList = await resolvedCtx.db.query.ideas.findMany({
            where: eq(ideas.agentId, input.agentId),
            with: {
               agent: true,
            },
         });
         return ideasList;
      }),

   getAgentIdeasCount: protectedProcedure
      .input(z.object({ agentId: z.string().min(1) }))
      .query(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         return await getAgentIdeasCount(resolvedCtx.db, input.agentId);
      }),

   listByAgentPaginated: protectedProcedure
      .input(
         z.object({
            agentId: z.string().min(1),
            page: z.number().min(1).default(1),
            limit: z.number().min(1).max(50).default(10),
         }),
      )
      .query(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         try {
            const offset = (input.page - 1) * input.limit;
            const ideasList = await resolvedCtx.db.query.ideas.findMany({
               where: eq(ideas.agentId, input.agentId),
               limit: input.limit,
               offset,
               orderBy: (ideas, { desc }) => [desc(ideas.createdAt)],
               with: {
                  agent: true,
               },
            });
            const total = await getAgentIdeasCount(
               resolvedCtx.db,
               input.agentId,
            );
            return {
               items: ideasList,
               total,
               page: input.page,
               limit: input.limit,
            };
         } catch (err) {
            throw new TRPCError({
               code: "INTERNAL_SERVER_ERROR",
               message: (err as Error).message,
            });
         }
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

   bulkApprove: protectedProcedure
      .input(z.object({ ids: z.array(z.string()).min(1) }))
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const db = resolvedCtx.db;
         const { ids } = input;

         if (!ids || ids.length === 0) {
            throw new TRPCError({
               code: "BAD_REQUEST",
               message: "At least one idea ID is required.",
            });
         }

         const userId = resolvedCtx.session?.user.id;
         const organizationId =
            resolvedCtx.session?.session?.activeOrganizationId;

         if (!userId) {
            throw new TRPCError({
               code: "UNAUTHORIZED",
               message: "User must be authenticated to approve ideas.",
            });
         }

         // Get all agents belonging to the user to verify ownership
         const agents = await listAgents(resolvedCtx.db, {
            userId,
            organizationId: organizationId ?? "",
         });
         const allUserAgentIds = agents.map((agent) => agent.id);

         if (allUserAgentIds.length === 0) {
            throw new TRPCError({
               code: "FORBIDDEN",
               message: "No agents found for this user.",
            });
         }

         // Fetch all ideas to verify ownership and status
         const ideasList = await db.query.ideas.findMany({
            where: (ideas, { inArray, and, eq }) =>
               and(
                  inArray(ideas.id, ids),
                  inArray(ideas.agentId, allUserAgentIds),
                  eq(ideas.status, "pending"), // Only pending ideas can be approved
               ),
            with: {
               agent: true,
            },
         });

         const foundIds = ideasList.map((idea) => idea.id);
         const notFoundIds = ids.filter((id) => !foundIds.includes(id));

         if (notFoundIds.length > 0) {
            throw new TRPCError({
               code: "NOT_FOUND",
               message: `Ideas not found or not accessible: ${notFoundIds.join(", ")}`,
            });
         }

         // Filter to only process pending items (already filtered in query, but being explicit)
         const approvableIdeas = ideasList.filter(
            (idea) => idea.status === "pending",
         );

         let approvedCount = 0;

         // Process each approvable idea
         for (const idea of approvableIdeas) {
            try {
               // Update status
               await updateIdea(db, idea.id, { status: "approved" });

               // Create content
               const content = await createContent(db, {
                  agentId: idea.agentId,
                  request: { description: idea.content },
               });

               // Enqueue job
               await enqueueContentPlanningJob({
                  agentId: idea.agentId,
                  contentId: content.id,
                  contentRequest: { description: idea.content },
               });

               approvedCount++;
            } catch (error) {
               console.error(`Failed to approve idea ${idea.id}:`, error);
               // Continue with other ideas even if one fails
            }
         }

         return {
            success: true,
            approvedCount,
            totalSelected: ids.length,
            approvableCount: approvableIdeas.length,
         };
      }),
});
