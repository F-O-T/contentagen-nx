import {
   createAgent,
   getAgentById,
   updateAgent,
   deleteAgent,
   listAgentsByUserId,
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

export const agentRouter = router({
   transferToOrganization: protectedProcedure
      .input(AgentSelectSchema.pick({ id: true }))
      .mutation(async ({ ctx, input }) => {
         const { id } = input;
         const session = ctx.session;
         if (!session?.user?.id) {
            throw new TRPCError({
               code: "UNAUTHORIZED",
               message: "User not authenticated.",
            });
         }
         const resolvedCtx = await ctx;
         const agent = await getAgentById(resolvedCtx.db, id);
         if (!agent) {
            throw new TRPCError({
               code: "NOT_FOUND",
               message: "Agent not found.",
            });
         }
         if (agent.userId !== session.user.id) {
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
         // Get user's organizations using Better Auth
         const orgsRes = await resolvedCtx.auth.api.listOrganizations({
            headers: resolvedCtx.headers,
         });
         if (!orgsRes.length) {
            throw new TRPCError({
               code: "BAD_REQUEST",
               message: "You are not a member of any organization.",
            });
         }
         const organization = orgsRes[0];
         if (!organization?.id) {
            throw new TRPCError({
               code: "BAD_REQUEST",
               message: "Organization ID is missing.",
            });
         }
         await resolvedCtx.auth.api.setActiveOrganization({
            headers: resolvedCtx.headers,
            body: {
               organizationId: organization.id,
            },
         });
         const member = await resolvedCtx.auth.api.getActiveMember({
            // This endpoint requires session cookies.
            headers: resolvedCtx.headers,
         });
         if (member?.role !== "owner") {
            throw new TRPCError({
               code: "FORBIDDEN",
               message:
                  "You must be the owner of the organization to transfer.",
            });
         }
         const updatedAgent = await updateAgent(resolvedCtx.db, id, {
            organizationId: organization.id,
            updatedAt: new Date(),
         });
         return updatedAgent;
      }),
   stats: protectedProcedure
      .input(AgentSelectSchema.pick({ id: true }))
      .query(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const contents = await getAgentContentStats(resolvedCtx.db, input.id);

         const toNumber = (val: unknown) => {
            const n = Number(val);
            return Number.isFinite(n) ? n : 0;
         };
         const isNumber = (val: unknown): val is number =>
            typeof val === "number" && Number.isFinite(val);

         const wordsWritten = contents.reduce(
            (sum, item) => sum + toNumber(item.stats?.wordsCount),
            0,
         );
         const totalDraft = contents.filter(
            (item) => item.status === "draft",
         ).length;
         const totalPublished = contents.filter(
            (item) => item.status === "approved",
         ).length;

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
   listByUser: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      try {
         const userId = resolvedCtx.session?.user.id;
         if (!userId) {
            throw new TRPCError({
               code: "UNAUTHORIZED",
               message: "User ID is required to list agents.",
            });
         }
         return await listAgentsByUserId(resolvedCtx.db, userId);
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
