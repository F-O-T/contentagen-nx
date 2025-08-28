import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { getAgentById } from "@packages/database/repositories/agent-repository";

export const authorRouter = router({
   getByAgentId: protectedProcedure
      .input(z.object({ agentId: z.string() }))
      .query(async ({ ctx, input }) => {
         const db = (await ctx).db;
         const agent = await getAgentById(db, input.agentId);
         if (!agent) throw new Error("Agent not found");
         return {
            name: agent.personaConfig?.metadata?.name ?? "",
            profilePhotoUrl: agent.profilePhotoUrl ?? null,
         };
      }),
});
