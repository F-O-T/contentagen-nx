import { Elysia, t } from "elysia";
import { db } from "../integrations/database";
import { contentRequest, content } from "../schemas/content-schema";
import { createInsertSchema } from "drizzle-typebox";
import { authMiddleware } from "../integrations/auth";
import { contentGenerationQueue } from "@api/workers/content-generation";
import { embeddingService } from "../services/embedding";

import { and, desc, eq, gt, ne, sql, cosineDistance } from "drizzle-orm";

const _createContentRequest = createInsertSchema(contentRequest);

export const contentRoutes = new Elysia({
   prefix: "/content/request",
})
   .use(authMiddleware)
   .post(
      "/generate",
      async ({ body, set, user }) => {
         const { id: userId } = user;

         try {
            // Generate embedding for the content request
            const embedding = await embeddingService.generateContentRequestEmbedding(
               body.topic,
               body.briefDescription
            );

            const [request] = await db
               .insert(contentRequest)
               .values({
                  ...body,
                  userId,
                  embedding,
               })
               .returning();

            set.status = 201;
            return {
               request,
            };
         } catch (error) {
            console.error("Error generating content request embedding:", error);
            // Fallback: create request without embedding
            const [request] = await db
               .insert(contentRequest)
               .values({
                  ...body,
                  userId,
               })
               .returning();

            set.status = 201;
            return {
               request,
            };
         }
      },
      {
         auth: true,
         body: t.Omit(_createContentRequest, [
            "id",
            "updatedAt",
            "createdAt",
            "isCompleted",
            "generatedContentId",
            "userId",
            "status",
            "embedding",
         ]),
      },
   )
   .post(
      "/approve/:id",
      async ({ params, set }) => {
         const { id } = params;

         const [request] = await db
            .update(contentRequest)
            .set({ status: "approved" })
            .where(eq(contentRequest.id, id))
            .returning();

         if (!request) {
            set.status = 404;
            return { message: "Content request not found" };
         }

         await contentGenerationQueue.add("generateContent", {
            requestId: request.id,
         });

         set.status = 202;
         return {
            request,
         };
      },
      {
         auth: true,
         params: t.Object({
            id: t.String(),
         }),
      },
   )
   .post(
      "/reject/:id",
      async ({ params, set }) => {
         const { id } = params;

         const [request] = await db
            .update(contentRequest)
            .set({ status: "rejected" })
            .where(eq(contentRequest.id, id))
            .returning();

         if (!request) {
            set.status = 404;
            return { message: "Content request not found" };
         }

         return {
            request,
         };
      },
      {
         auth: true,
         params: t.Object({
            id: t.String(),
         }),
      },
   )
   .get(
      "/list",
      async ({ user, query }) => {
         const { id: userId } = user;
         const { page = 1, limit = 10, status } = query;
         const offset = (page - 1) * limit;

         let whereClause = eq(contentRequest.userId, userId);
         if (status) {
            whereClause = and(whereClause, eq(contentRequest.status, status))!;
         }

         const requests = await db.query.contentRequest.findMany({
            columns: {
               id: true,
               topic: true,
               briefDescription: true,
               targetLength: true,
               status: true,
               isCompleted: true,
               createdAt: true,
               updatedAt: true,
               agentId: true,
               generatedContentId: true,
            },
            where: whereClause,
            orderBy: desc(contentRequest.createdAt),
            limit: limit,
            offset: offset,
         });

         return {
            requests,
            pagination: {
               page,
               limit,
               total: requests.length,
            },
         };
      },
      {
         auth: true,
         query: t.Object({
            page: t.Optional(t.Number({ minimum: 1 })),
            limit: t.Optional(t.Number({ minimum: 1, maximum: 50 })),
            status: t.Optional(t.Union([
               t.Literal("pending"),
               t.Literal("approved"), 
               t.Literal("rejected")
            ])),
         }),
      },
   )
   .get(
      "/details/:id",
      async ({ params, user, set }) => {
         const { id } = params;
         const { id: userId } = user;

         const [request] = await db.query.contentRequest.findMany({
            where: and(
               eq(contentRequest.id, id),
               eq(contentRequest.userId, userId)
            ),
            with:{
               generatedContent:true 
            },
            limit: 1,
         });

         if (!request) {
            set.status = 404;
            return {
               message: "Content request not found.",
            };
         }

         return {
            request,
         };
      },
      {
         auth: true,
         params: t.Object({
            id: t.String(),
         }),
      },
   )
   .get(
      "/similarities/:id",
      async ({ params, user, set }) => {
         const { id } = params;
         const { id: userId } = user;

         // First verify the request belongs to the user
         const [originalRequest] = await db.query.contentRequest.findMany({
            columns: { 
               embedding: true,
               userId: true 
            },
            where: and(
               eq(contentRequest.id, id),
               eq(contentRequest.userId, userId)
            ),
            limit: 1,
         });

         if (!originalRequest) {
            set.status = 404;
            return {
               message: "Content request not found.",
            };
         }

         if (!originalRequest.embedding) {
            return {
               similarRequests: [],
               similarity: 0,
               category: "info" as const,
               message: "No similarity data available - request is being processed.",
            };
         }

         const similarity = sql<number>`1 - (${cosineDistance(
            contentRequest.embedding,
            originalRequest.embedding,
         )})`;

         const similarRequests = await db.query.contentRequest.findMany({
            columns: {
               id: true,
               topic: true,
               briefDescription: true,
               status: true,
               createdAt: true,
            },
            extras: {
               similarity: similarity.as("similarity"),
            },
            where: and(
               eq(contentRequest.userId, userId),
               ne(contentRequest.id, id), 
               gt(similarity, 0.3)
            ),
            orderBy: desc(similarity),
            limit: 5,
         });

         // Calculate overall similarity score
         const maxSimilarity = similarRequests[0]?.similarity || 0;
         
         // Use embedding service to categorize similarity
         const { category, message } = embeddingService.categorizeSimilarity(maxSimilarity);

         return {
            similarRequests,
            similarity: maxSimilarity,
            category,
            message,
         };
      },
      {
         auth: true,
         params: t.Object({
            id: t.String(),
         }),
      },
   )
   .get(
      "/content-similarity/:contentId",
      async ({ params, user, set }) => {
         const { contentId } = params;
         const { id: userId } = user;

         // First verify the content belongs to the user
         const [originalContent] = await db.query.content.findMany({
            columns: { 
               embedding: true,
               userId: true,
               title: true,
               body: true,
            },
            where: and(
               eq(content.id, contentId),
               eq(content.userId, userId)
            ),
            limit: 1,
         });

         if (!originalContent) {
            set.status = 404;
            return {
               message: "Content not found.",
            };
         }

         if (!originalContent.embedding) {
            return {
               similarContent: [],
               similarity: 0,
               category: "info" as const,
               message: "No similarity data available - content is being processed.",
            };
         }

         const similarity = sql<number>`1 - (${cosineDistance(
            content.embedding,
            originalContent.embedding,
         )})`;

         const similarContent = await db.query.content.findMany({
            columns: {
               id: true,
               title: true,
               body: true,
               status: true,
               createdAt: true,
               agentId: true,
            },
            extras: {
               similarity: similarity.as("similarity"),
            },
            where: and(
               eq(content.userId, userId),
               ne(content.id, contentId), 
               gt(similarity, 0.3)
            ),
            orderBy: desc(similarity),
            limit: 5,
         });

         // Calculate overall similarity score
         const maxSimilarity = similarContent[0]?.similarity || 0;
         
         // Use embedding service to categorize similarity
         const { category, message } = embeddingService.categorizeSimilarity(maxSimilarity);

         return {
            similarContent,
            similarity: maxSimilarity,
            category,
            message,
         };
      },
      {
         auth: true,
         params: t.Object({
            contentId: t.String(),
         }),
      },
   )
   .post(
      "/regenerate-embeddings",
      async ({ set, user }) => {
         const { id: userId } = user;

         try {
            // Regenerate embeddings for content requests without embeddings
            const requestsWithoutEmbeddings = await db.query.contentRequest.findMany({
               where: and(
                  eq(contentRequest.userId, userId),
                  sql`${contentRequest.embedding} IS NULL`
               ),
            });

            let updatedRequests = 0;
            for (const request of requestsWithoutEmbeddings) {
               try {
                  const embedding = await embeddingService.generateContentRequestEmbedding(
                     request.topic,
                     request.briefDescription
                  );

                  await db
                     .update(contentRequest)
                     .set({ embedding })
                     .where(eq(contentRequest.id, request.id));

                  updatedRequests++;
               } catch (error) {
                  console.error(`Failed to generate embedding for request ${request.id}:`, error);
               }
            }

            // Regenerate embeddings for content without embeddings
            const contentWithoutEmbeddings = await db.query.content.findMany({
               where: and(
                  eq(content.userId, userId),
                  sql`${content.embedding} IS NULL`
               ),
            });

            let updatedContent = 0;
            for (const contentItem of contentWithoutEmbeddings) {
               try {
                  const embedding = await embeddingService.generateContentEmbedding(
                     contentItem.title,
                     contentItem.body
                  );

                  await db
                     .update(content)
                     .set({ embedding })
                     .where(eq(content.id, contentItem.id));

                  updatedContent++;
               } catch (error) {
                  console.error(`Failed to generate embedding for content ${contentItem.id}:`, error);
               }
            }

            return {
               message: "Embeddings regeneration completed",
               stats: {
                  updatedRequests,
                  updatedContent,
                  totalRequests: requestsWithoutEmbeddings.length,
                  totalContent: contentWithoutEmbeddings.length,
               },
            };
         } catch (error) {
            console.error("Error regenerating embeddings:", error);
            set.status = 500;
            return {
               message: "Failed to regenerate embeddings",
            };
         }
      },
      {
         auth: true,
      },
   )
   .post(
      "/content/:contentId/generate-embedding",
      async ({ params, set, user }) => {
         const { contentId } = params;
         const { id: userId } = user;

         try {
            // Verify the content belongs to the user
            const [existingContent] = await db.query.content.findMany({
               where: and(
                  eq(content.id, contentId),
                  eq(content.userId, userId)
               ),
               limit: 1,
            });

            if (!existingContent) {
               set.status = 404;
               return {
                  message: "Content not found.",
               };
            }

            // Generate embedding for the content
            const embedding = await embeddingService.generateContentEmbedding(
               existingContent.title,
               existingContent.body
            );

            // Update the content with the new embedding
            const [updatedContent] = await db
               .update(content)
               .set({ embedding })
               .where(eq(content.id, contentId))
               .returning();

            return {
               message: "Embedding generated successfully",
               content: updatedContent,
            };
         } catch (error) {
            console.error("Error generating content embedding:", error);
            set.status = 500;
            return {
               message: "Failed to generate embedding",
            };
         }
      },
      {
         auth: true,
         params: t.Object({
            contentId: t.String(),
         }),
      },
   );
