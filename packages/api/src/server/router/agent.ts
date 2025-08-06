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
import { generateSystemPrompt } from "@packages/prompts/helpers/agent-system-prompt-assembler";

export const agentRouter = router({
   regenerateSystemPrompt: protectedProcedure
      .input(AgentSelectSchema.pick({ id: true }))
      .mutation(async ({ ctx, input }) => {
         // 1. Load agent
         const agent = await getAgentById((await ctx).db, input.id);
         if (!agent)
            throw new TRPCError({
               code: "NOT_FOUND",
               message: "Agent not found",
            });
         // 2. Regenerate system prompt
         const newSystemPrompt = generateSystemPrompt(agent.personaConfig);
         // 3. Update agent
         const updated = await updateAgent((await ctx).db, input.id, {
            systemPrompt: newSystemPrompt,
         });
         return updated;
      }),
   updateSystemPrompt: protectedProcedure
      .input(
         AgentUpdateSchema.pick({
            id: true,
            systemPrompt: true,
         }),
      )
      .mutation(async ({ ctx, input }) => {
         if (!input.id) {
            throw new TRPCError({
               code: "BAD_REQUEST",
               message: "Agent ID is required for updating the system prompt.",
            });
         }
         // 1. Update only the system prompt
         const updated = await updateAgent((await ctx).db, input.id, {
            systemPrompt: input.systemPrompt,
         });
         return updated;
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
               systemPrompt: generateSystemPrompt(input),
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
         const getNewSystemPrompt = () => {
            if (!updateFields.personaConfig) {
               return;
            }
            return generateSystemPrompt({
               ...updateFields.personaConfig,
            });
         };
         const systemPrompt = getNewSystemPrompt();
         try {
            await updateAgent((await ctx).db, id, {
               personaConfig: updateFields.personaConfig,
               systemPrompt,
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
