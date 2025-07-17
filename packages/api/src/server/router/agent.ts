import type { AgentInsert } from "@packages/database";
import { agent } from "@packages/database";
import { Type } from "@sinclair/typebox";
import { TRPCError } from "@trpc/server";
import { wrap } from "@typeschema/typebox";
import { eq } from "drizzle-orm";
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
         const inserted = await ctx.db
            .insert(agent)
            .values(input as AgentInsert)
            .returning();
         return inserted[0];
      }),

   update: protectedProcedure
      .input(wrap(UpdateAgentInput))
      .mutation(async ({ ctx, input }) => {
         const { id, ...updateFields } = input;
         const existing = await ctx.db
            .select()
            .from(agent)
            .where(eq(agent.id, id));
         if (existing.length === 0) {
            throw new TRPCError({
               code: "NOT_FOUND",
               message: "Agent not found.",
            });
         }
         await ctx.db.update(agent).set(updateFields).where(eq(agent.id, id));
         return { success: true };
      }),

   delete: protectedProcedure
      .input(wrap(DeleteAgentInput))
      .mutation(async ({ ctx, input }) => {
         const { id } = input;
         const existing = await ctx.db
            .select()
            .from(agent)
            .where(eq(agent.id, id));
         if (existing.length === 0) {
            throw new TRPCError({
               code: "NOT_FOUND",
               message: "Agent not found.",
            });
         }
         await ctx.db.delete(agent).where(eq(agent.id, id));
         return { success: true };
      }),

   get: protectedProcedure
      .input(wrap(GetAgentInput))
      .query(async ({ ctx, input }) => {
         const found = await ctx.db
            .select()
            .from(agent)
            .where(eq(agent.id, input.id));
         if (found.length === 0) {
            throw new TRPCError({
               code: "NOT_FOUND",
               message: "Agent not found.",
            });
         }
         return found[0];
      }),

   list: protectedProcedure.query(async ({ ctx }) => {
      return ctx.db.select().from(agent);
   }),
});
