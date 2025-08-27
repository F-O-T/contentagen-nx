import { sdkProcedure, router } from "../trpc";
import {
   ListContentByAgentInputSchema,
   GetContentBySlugInputSchema,
} from "@packages/database/schemas/content";
import {
   listContents,
   getContentBySlug,
} from "@packages/database/repositories/content-repository";
import { ContentSelectSchema } from "@packages/database/schemas/content";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getCollection, queryCollection } from "@packages/chroma-db/helpers";

export const sdkRouter = router({
   getRelatedSlugs: sdkProcedure
      .input(GetContentBySlugInputSchema)
      .query(async ({ ctx, input }) => {
         if (!input.slug || !input.agentId) {
            throw new TRPCError({
               code: "BAD_REQUEST",
               message: "Slug and Agent ID are required.",
            });
         }
         const resolvedCtx = await ctx;
         const collection = await getCollection(
            resolvedCtx.chromaClient,
            "RelatedSlugs",
         );
         const results = await queryCollection(collection, {
            queryTexts: [input.slug],
            nResults: 5,
            whereDocument: {
               $not_contains: input.slug,
            },

            include: ["documents", "metadatas", "distances"],
            where: { agentId: input.agentId },
         });
         const slugs = results.documents
            .flat()
            .filter(
               (doc): doc is string => typeof doc === "string" && doc !== null,
            );
         return slugs;
      }),
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
         const all = await listContents((await ctx).db, agentId, status);
         const start = (page - 1) * limit;
         const end = start + limit;
         const posts = all.slice(start, end);
         return { posts, total: all.length };
      }),
   getContentBySlug: sdkProcedure
      .input(GetContentBySlugInputSchema)
      .output(ContentSelectSchema)
      .query(async ({ ctx, input }) => {
         try {
            return await getContentBySlug(
               (await ctx).db,
               input.slug,
               input.agentId,
            );
         } catch (err) {
            throw new TRPCError({
               code: "NOT_FOUND",
               message:
                  err instanceof Error ? err.message : "Content not found",
            });
         }
      }),
});
