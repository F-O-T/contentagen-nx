import { sdkProcedure, router } from "../trpc";
import {
   ListContentByAgentInputSchema,
   GetContentByIdInputSchema,
   GetContentBySlugInputSchema,
} from "@packages/database/schemas/content";
import {
   listContents,
   getContentById,
   getContentBySlug,
} from "@packages/database/repositories/content-repository";
import { ContentSelectSchema } from "@packages/database/schemas/content";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
export const sdkRouter = router({
   listContentByAgent: sdkProcedure
      .input(ListContentByAgentInputSchema)
      .output(
         z.object({
            posts: ContentSelectSchema.pick({
               id: true,
               meta: true,
               imageUrl: true,
               status: true,
               createdAt: true,
               stats: true,
            }).array(),
            total: z.number(),
         }),
      )
      .query(async ({ ctx, input }) => {
         const { agentId, limit = 10, page = 1, status } = input;
         //TODO: atualizar o sdk para entrar array de agentId
         const all = await listContents((await ctx).db, [agentId], status);
         const start = (page - 1) * limit;
         const end = start + limit;
         const posts = all.slice(start, end);
         return { posts, total: all.length };
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
   getContentBySlug: sdkProcedure
      .input(GetContentBySlugInputSchema)
      .output(ContentSelectSchema)
      .query(async ({ ctx, input }) => {
         try {
            return await getContentBySlug((await ctx).db, input.slug);
         } catch (err) {
            throw new TRPCError({
               code: "NOT_FOUND",
               message:
                  err instanceof Error ? err.message : "Content not found",
            });
         }
      }),
});
