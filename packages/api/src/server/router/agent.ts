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
   stats: protectedProcedure
      .input(AgentSelectSchema.pick({ id: true }))
      .query(async ({ ctx, input }) => {
         const contents = await getAgentContentStats((await ctx).db, input.id);

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
         try {
            const userId = ctx.session.user.id;
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
            return await createAgent((await ctx).db, { ...agentData });
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
         const { id, ...updateFields } = input;
         if (!id) {
            throw new TRPCError({
               code: "BAD_REQUEST",
               message: "Agent ID is required for update.",
            });
         }
         try {
            await updateAgent((await ctx).db, id, {
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
         const { id } = input;
         try {
            await deleteAgent((await ctx).db, id);
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
         try {
            return await getAgentById((await ctx).db, input.id);
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
      try {
         return await listAgentsByUserId((await ctx).db, ctx.session.user.id);
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
