import {
   createAgent,
   getAgentById,
   updateAgent,
   deleteAgent,
   listAgents,
} from "@packages/database/repositories/agent-repository";
import { NotFoundError, DatabaseError } from "@packages/errors";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../trpc";
import { AgentUpdateSchema, type AgentInsert } from "@packages/database/schema";
import {
   AgentSelectSchema,
   PersonaConfigSchema,
} from "@packages/database/schemas/agent";
import { getAgentContentStats } from "@packages/database/repositories/content-repository";
import { getAgentIdeasCount } from "@packages/database/repositories/ideas-repository";
import { countWords } from "@packages/helpers/text";
import { publicProcedure } from "../trpc";
import { z } from "zod";

import {
   eventEmitter,
   EVENTS,
   type AgentKnowledgeStatusChangedPayload,
} from "@packages/server-events";
import { on } from "node:events";

export const agentRouter = router({
   onBrandKnowledgeStatusChanged: publicProcedure
      .input(z.object({ agentId: z.string().optional() }).optional())
      .subscription(async function* (opts) {
         for await (const [payload] of on(
            eventEmitter,
            EVENTS.agentKnowledgeStatus,
            {
               signal: opts.signal,
            },
         )) {
            const event = payload as AgentKnowledgeStatusChangedPayload;
            if (!opts.input?.agentId || opts.input.agentId === event.agentId) {
               yield event;
            }
         }
      }),

   transferToOrganization: protectedProcedure
      .input(AgentSelectSchema.pick({ id: true }))
      .mutation(async ({ ctx, input }) => {
         const { id } = input;
         const resolvedCtx = await ctx;
         const userId = resolvedCtx.session?.user?.id;
         const organizationId =
            resolvedCtx.session?.session?.activeOrganizationId;
         if (!userId) {
            throw new TRPCError({
               code: "UNAUTHORIZED",
               message: "User not authenticated.",
            });
         }
         if (!organizationId) {
            throw new TRPCError({
               code: "BAD_REQUEST",
               message: "No active organization found in session.",
            });
         }
         const agent = await getAgentById(resolvedCtx.db, id);
         if (!agent) {
            throw new TRPCError({
               code: "NOT_FOUND",
               message: "Agent not found.",
            });
         }
         if (agent.userId !== userId) {
            throw new TRPCError({
               code: "FORBIDDEN",
               message: "You do not own this agent.",
            });
         }
         if (agent.organizationId) {
            throw new TRPCError({
               code: "BAD_REQUEST",
               message: "Agent is already owned by an organization.",
            });
         }
         // Optionally, you may want to check the user's role here, depending on business logic
         const updatedAgent = await updateAgent(resolvedCtx.db, id, {
            organizationId,
            updatedAt: new Date(),
         });
         return updatedAgent;
      }),
   stats: protectedProcedure
      .input(AgentSelectSchema.pick({ id: true }))
      .query(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const contents = await getAgentContentStats(resolvedCtx.db, input.id);
         const totalIdeas = await getAgentIdeasCount(resolvedCtx.db, input.id);

         const wordsWritten = countWords(
            contents.map((item) => item.body).join(" "),
         );

         const totalDraft = contents.filter(
            (item) => item.status === "draft",
         ).length;
         const totalPublished = contents.filter(
            (item) => item.status === "approved",
         ).length;
         const isNumber = (value: unknown): value is number =>
            typeof value === "number" && !Number.isNaN(value);
         const toNumber = (value: unknown): number | null => {
            const num = Number(value);
            return Number.isNaN(num) ? null : num;
         };
         const qualityScores = contents
            .map((item) => toNumber(item.stats?.qualityScore))
            .filter(isNumber);
         const avgQualityScore =
            qualityScores.length > 0
               ? qualityScores.reduce((sum, val) => sum + val, 0) /
                 qualityScores.length
               : null;

         return {
            wordsWritten,
            totalDraft,
            totalPublished,
            totalIdeas,
            avgQualityScore,
         };
      }),
   create: protectedProcedure
      .input(PersonaConfigSchema)
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         try {
            const userId = resolvedCtx.session?.user.id;
            if (!userId) {
               throw new TRPCError({
                  code: "UNAUTHORIZED",
                  message: "User ID is required to create an agent.",
               });
            }
            const agentData: Omit<
               AgentInsert,
               "id" | "createdAt" | "updatedAt"
            > = {
               personaConfig: input,
               userId: userId,
            };
            return await createAgent(resolvedCtx.db, { ...agentData });
         } catch (err) {
            if (err instanceof DatabaseError) {
               throw new TRPCError({
                  code: "INTERNAL_SERVER_ERROR",
                  message: err.message,
               });
            }
            throw err;
         }
      }),
   update: protectedProcedure
      .input(
         AgentUpdateSchema.pick({
            id: true,
            personaConfig: true,
         }),
      )
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const { id, ...updateFields } = input;
         if (!id) {
            throw new TRPCError({
               code: "BAD_REQUEST",
               message: "Agent ID is required for update.",
            });
         }
         try {
            await updateAgent(resolvedCtx.db, id, {
               personaConfig: updateFields.personaConfig,
               updatedAt: new Date(),
            });
            return { success: true };
         } catch (err) {
            if (err instanceof NotFoundError) {
               throw new TRPCError({ code: "NOT_FOUND", message: err.message });
            }
            if (err instanceof DatabaseError) {
               throw new TRPCError({
                  code: "INTERNAL_SERVER_ERROR",
                  message: err.message,
               });
            }
            throw err;
         }
      }),
   delete: protectedProcedure
      .input(AgentSelectSchema.pick({ id: true }))
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const { id } = input;
         try {
            await deleteAgent(resolvedCtx.db, id);
            return { success: true };
         } catch (err) {
            if (err instanceof NotFoundError) {
               throw new TRPCError({ code: "NOT_FOUND", message: err.message });
            }
            if (err instanceof DatabaseError) {
               throw new TRPCError({
                  code: "INTERNAL_SERVER_ERROR",
                  message: err.message,
               });
            }
            throw err;
         }
      }),
   get: protectedProcedure
      .input(AgentSelectSchema.pick({ id: true }))
      .query(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         try {
            return await getAgentById(resolvedCtx.db, input.id);
         } catch (err) {
            if (err instanceof NotFoundError) {
               throw new TRPCError({ code: "NOT_FOUND", message: err.message });
            }
            if (err instanceof DatabaseError) {
               throw new TRPCError({
                  code: "INTERNAL_SERVER_ERROR",
                  message: err.message,
               });
            }
            throw err;
         }
      }),
   list: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      try {
         const userId = resolvedCtx.session?.user.id;
         const organizationId =
            resolvedCtx.session?.session?.activeOrganizationId;
         if (!userId && !organizationId) {
            throw new TRPCError({
               code: "UNAUTHORIZED",
               message: "User or organization ID is required to list agents.",
            });
         }
         if (!organizationId) {
            return await listAgents(resolvedCtx.db, { userId });
         }
         return await listAgents(resolvedCtx.db, { userId, organizationId });
      } catch (err) {
         if (err instanceof DatabaseError) {
            throw new TRPCError({
               code: "INTERNAL_SERVER_ERROR",
               message: err.message,
            });
         }
         throw err;
      }
   }),
});
