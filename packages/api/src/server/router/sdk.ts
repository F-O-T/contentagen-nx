import { sdkProcedure, router } from "../trpc";
import { APIError, propagateError } from "@packages/utils/errors";
import { mastra, setRuntimeContext } from "@packages/agents";
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

const ImageSchema = z
   .object({
      data: z.string(),
      contentType: z.string(),
   })
   .nullable();

import { getAgentById } from "@packages/database/repositories/agent-repository";
import { getContentById } from "@packages/database/repositories/content-repository";
import { streamFileForProxy } from "@packages/files/client";
import { searchRelatedSlugsByText } from "@packages/rag/repositories/related-slugs-repository";

export const sdkRouter = router({
   getAuthorByAgentId: sdkProcedure
      .input(GetContentBySlugInputSchema.pick({ agentId: true }))
      .output(
         z.object({
            name: z.string(),
            profilePhoto: ImageSchema,
         }),
      )
      .query(async ({ ctx, input }) => {
         const db = (await ctx).db;
         const minioClient = (await ctx).minioClient;
         const bucketName = (await ctx).minioBucket;
         const agent = await getAgentById(db, input.agentId);
         if (!agent)
            throw new TRPCError({
               code: "NOT_FOUND",
               message: "Agent not found",
            });
         let profilePhoto = null;
         if (agent.profilePhotoUrl) {
            try {
               const { buffer, contentType } = await streamFileForProxy(
                  agent.profilePhotoUrl,
                  bucketName,
                  minioClient,
               );
               profilePhoto = {
                  data: buffer.toString("base64"),
                  contentType,
               };
            } catch (err) {
               console.error("Error fetching profile photo:", err);
               profilePhoto = null;
            }
         }
         return {
            name: agent.personaConfig?.metadata?.name ?? "",
            profilePhoto,
         };
      }),
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
         const slugs = await searchRelatedSlugsByText(
            resolvedCtx.ragClient,
            input.slug,
            input.agentId,
            {
               limit: 5,
            },
         );
         return slugs;
      }),
   streamAssistantResponse: sdkProcedure
      .input(
         z.object({
            message: z.string(),
            language: z.enum(["en", "pt"]).optional().default("en"),
         }),
      )
      .query(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const userId = resolvedCtx?.session?.session.userId;
         if (!userId) {
            throw APIError.validation("User not authenticated");
         }
         const organization = await resolvedCtx.auth.api.listOrganizations({
            headers: resolvedCtx.headers,
         });
         const organizationId = organization[0]?.id;
         if (!organizationId) {
            throw APIError.validation("No organization found for user");
         }

         await resolvedCtx.auth.api.setActiveOrganization({
            headers: resolvedCtx.headers,
            body: { organizationId },
         });

         const runtimeContext = setRuntimeContext({
            userId,
            language: resolvedCtx.language,
            organizationId,
         });
         try {
            const agent = mastra.getAgent("appAssistantAgent");

            const result = await agent.generate(
               [{ role: "user", content: input.message }],
               { runtimeContext },
            );

            return result.text;
         } catch (error) {
            console.error("Error processing agent generation:", error);
            propagateError(error);
            throw APIError.internal("Error processing agent generation");
         }
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
               shareStatus: true,
            })
               .extend({
                  image: ImageSchema,
               })
               .array(),
            total: z.number(),
         }),
      )
      .query(async ({ ctx, input }) => {
         const { agentId, limit = 10, page = 1, status } = input;
         const resolvedCtx = await ctx;
         const all = await listContents(resolvedCtx.db, agentId, status);
         const start = (page - 1) * limit;
         const end = start + limit;
         const posts = all.slice(start, end);

         // Stream images for each post
         const postsWithImages = await Promise.all(
            posts.map(async (post) => {
               let image = null;
               if (post.imageUrl) {
                  try {
                     const { buffer, contentType } = await streamFileForProxy(
                        post.imageUrl,
                        resolvedCtx.minioBucket,
                        resolvedCtx.minioClient,
                     );
                     image = {
                        data: buffer.toString("base64"),
                        contentType,
                     };
                  } catch (error) {
                     console.error(
                        "Error fetching image for post:",
                        post.id,
                        error,
                     );
                     image = null;
                  }
               }
               return {
                  ...post,
                  image,
               };
            }),
         );

         return { posts: postsWithImages, total: all.length };
      }),
   getContentBySlug: sdkProcedure
      .input(GetContentBySlugInputSchema)
      .output(
         ContentSelectSchema.extend({
            image: ImageSchema,
         }),
      )
      .query(async ({ ctx, input }) => {
         try {
            const resolvedCtx = await ctx;
            const content = await getContentBySlug(
               resolvedCtx.db,
               input.slug,
               input.agentId,
            );

            let image = null;
            if (content.imageUrl) {
               try {
                  const { buffer, contentType } = await streamFileForProxy(
                     content.imageUrl,
                     resolvedCtx.minioBucket,
                     resolvedCtx.minioClient,
                  );
                  image = {
                     data: buffer.toString("base64"),
                     contentType,
                  };
               } catch (error) {
                  console.error(
                     "Error fetching image for content:",
                     content.id,
                     error,
                  );
                  image = null;
               }
            }

            return {
               ...content,
               image,
            };
         } catch (err) {
            throw new TRPCError({
               code: "NOT_FOUND",
               message:
                  err instanceof Error ? err.message : "Content not found",
            });
         }
      }),
   getContentImage: sdkProcedure
      .input(z.object({ contentId: z.string() }))
      .output(ImageSchema)
      .query(async ({ ctx, input }) => {
         try {
            const db = (await ctx).db;
            const content = await getContentById(db, input.contentId);

            if (!content?.imageUrl) {
               return null;
            }

            const bucketName = (await ctx).minioBucket;
            const key = content.imageUrl;

            const { buffer, contentType } = await streamFileForProxy(
               key,
               bucketName,
               (await ctx).minioClient,
            );

            return {
               data: buffer.toString("base64"),
               contentType,
            };
         } catch (error) {
            console.error("Error fetching content image:", error);
            return null;
         }
      }),
});
