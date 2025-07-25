import {
   createAgent,
   getAgentById,
   updateAgent,
   deleteAgent,
   listAgentsByUserId,
} from "@packages/database/repositories/agent-repository";
import { NotFoundError, DatabaseError } from "@packages/errors";
import { Type } from "@sinclair/typebox";
import { TRPCError } from "@trpc/server";
import { wrap } from "@typeschema/typebox";

import { protectedProcedure, router } from "../trpc";
import {
   AgentInsertSchema,
   AgentUpdateSchema,
   type AgentInsert,
} from "@packages/database/schema";

const CreateAgentInput = AgentInsertSchema;
const UpdateAgentInput = AgentUpdateSchema;

const DeleteAgentInput = Type.Object({
   id: Type.String({ format: "uuid" }),
});

const GetAgentInput = Type.Object({
   id: Type.String({ format: "uuid" }),
});

export const agentRouter = router({
   create: protectedProcedure
      .input(wrap(CreateAgentInput))
      .mutation(async ({ ctx, input }) => {
         try {
            return await createAgent((await ctx).db, input as AgentInsert);
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
      .input(wrap(UpdateAgentInput))
      .mutation(async ({ ctx, input }) => {
         const { id, ...updateFields } = input;
         if (!id) {
            throw new TRPCError({
               code: "BAD_REQUEST",
               message: "Agent ID is required for update.",
            });
         }

         try {
            await updateAgent(ctx.db, id, updateFields);
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
      .input(wrap(DeleteAgentInput))
      .mutation(async ({ ctx, input }) => {
         const { id } = input;
         try {
            await deleteAgent(ctx.db, id);
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
      .input(wrap(GetAgentInput))
      .query(async ({ ctx, input }) => {
         try {
            return await getAgentById(ctx.db, input.id);
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
         console.log("Listing agents for user:", ctx.session.user.id);
         return await listAgentsByUserId(ctx.db, ctx.session.user.id);
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
