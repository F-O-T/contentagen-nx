import { sdkProcedure, router } from "../trpc";
import {
   ListContentByAgentInputSchema,
   GetContentByIdInputSchema,
} from "@contentagen/sdk";
import {
   listContents,
   getContentById,
} from "@packages/database/repositories/content-repository";
import { ContentSelectSchema } from "@packages/database/schemas/content";
import { TRPCError } from "@trpc/server";

export const sdkRouter = router({
   listContentByAgent: sdkProcedure
      .input(ListContentByAgentInputSchema)
      .output(ContentSelectSchema.array())
      .query(async ({ ctx, input }) => {
         console.log("listContentByAgent called with input:", input);
         const { agentId, limit = 10, page = 1 } = input;
         const all = await listContents((await ctx).db, agentId);
         // Simple pagination
         const start = (page - 1) * limit;
         const end = start + limit;
         return all.slice(start, end);
      }),
   getContentById: sdkProcedure
      .input(GetContentByIdInputSchema)
      .output(ContentSelectSchema)
      .query(async ({ ctx, input }) => {
         try {
            return await getContentById((await ctx).db, input.id);
         } catch (err) {
            throw new TRPCError({
               code: "NOT_FOUND",
               message:
                  err instanceof Error ? err.message : "Content not found",
            });
         }
      }),
});
