import type { AgentInsert } from "@packages/database";
import {
  createAgent,
  getAgentById,
  updateAgent,
  deleteAgent,
  listAgents,
} from "@packages/database/repositories/agent.repository";
import { NotFoundError, DatabaseError } from "@packages/errors";
import { Type } from "@sinclair/typebox";
import { TRPCError } from "@trpc/server";
import { wrap } from "@typeschema/typebox";

import { protectedProcedure, router } from "../trpc";

// Input schemas
const CreateAgentInput = Type.Object({
  userId: Type.String(),
  personaConfig: Type.Any(), // Should match PersonaConfigSchema, but for brevity
  systemPrompt: Type.String(),
  name: Type.String(),
  description: Type.Optional(Type.String()),
  isActive: Type.Optional(Type.Boolean()),
});

const UpdateAgentInput = Type.Object({
  id: Type.String({ format: "uuid" }),
  personaConfig: Type.Optional(Type.Any()),
  systemPrompt: Type.Optional(Type.String()),
  name: Type.Optional(Type.String()),
  description: Type.Optional(Type.String()),
  isActive: Type.Optional(Type.Boolean()),
});

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
        return await createAgent(ctx.db, input as AgentInsert);
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
  list: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await listAgents(ctx.db);
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
