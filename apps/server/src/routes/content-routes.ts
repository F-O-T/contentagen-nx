import { Elysia, t } from "elysia";
import { db } from "../integrations/database";
import { contentRequest, content } from "../schemas/content-schema";
import { createInsertSchema, createSelectSchema } from "drizzle-typebox";
import { authMiddleware } from "../integrations/auth";
import { contentGenerationQueue } from "@api/workers/content-generation";
import { categorizeSimilarity, embeddingService } from "../services/embedding";
import { and, desc, eq, gt, ne, sql, cosineDistance } from "drizzle-orm";

// OpenAPI Tags for route organization
enum ApiTags {
   CONTENT_REQUESTS = "Content Requests",
   CONTENT_MANAGEMENT = "Content Management", 
   CONTENT = "Content",
   AI_ANALYSIS = "Vector Analysis",
   MAINTENANCE = "Maintenance"
}

const _createContentRequest = createInsertSchema(contentRequest);
const _selectContentRequest = createSelectSchema(contentRequest);
const _selectContent = createSelectSchema(content);

// Specific schemas for different endpoints
const _contentRequestParams = t.Object({
   id: t.String({ format: "uuid" }),
});

const _contentParams = t.Object({
   contentId: t.String({ format: "uuid" }),
});

const _listContentRequestsQuery = t.Object({
   page: t.Optional(t.Number({ minimum: 1 })),
   limit: t.Optional(t.Number({ minimum: 1, maximum: 50 })),
   status: t.Optional(t.Union([
      t.Literal("pending"),
      t.Literal("approved"), 
      t.Literal("rejected")
   ])),
});

const _approveRejectResponse = t.Object({
   request: _selectContentRequest,
});

const _listContentRequestsResponse = t.Object({
   requests: t.Array(t.Pick(_selectContentRequest, [
      'id', 'topic', 'briefDescription', 'targetLength', 
      'status', 'isCompleted', 'createdAt', 'updatedAt', 
      'agentId', 'generatedContentId'
   ])),
   pagination: t.Object({
      page: t.Number(),
      limit: t.Number(),
      total: t.Number(),
   }),
});

const _contentRequestDetailsResponse = t.Object({
   request: t.Intersect([
      _selectContentRequest,
      t.Object({
         generatedContent: t.Optional(t.Nullable(_selectContent)),
      }),
   ]),
});

const _similarityResponse = t.Object({
   similarRequests: t.Array(t.Pick(_selectContentRequest, [
      'id', 'topic', 'briefDescription', 'status', 'createdAt'
   ])),
   similarity: t.Number(),
   category: t.Union([
      t.Literal("info"),
      t.Literal("warning"),
      t.Literal("error"),
   ]),
   message: t.String(),
});

const _contentSimilarityResponse = t.Object({
   similarContent: t.Array(t.Intersect([
      t.Pick(_selectContent, [
         'id', 'title', 'body', 'status', 'createdAt', 'agentId'
      ]),
      t.Object({
         similarity: t.Optional(t.Number()),
      }),
   ])),
   similarity: t.Number(),
   category: t.Union([
      t.Literal("info"),
      t.Literal("warning"),
      t.Literal("error"),
   ]),
   message: t.String(),
});

const _regenerateEmbeddingsResponse = t.Object({
   message: t.String(),
   stats: t.Object({
      updatedRequests: t.Number(),
      updatedContent: t.Number(),
      totalRequests: t.Number(),
      totalContent: t.Number(),
   }),
});

const _generateEmbeddingResponse = t.Object({
   message: t.String(),
   content: _selectContent,
});

const _errorResponse = t.Object({
   message: t.String(),
});
export const contentRoutes = new Elysia({
   prefix: "/content/request",
   tags: [ApiTags.CONTENT_REQUESTS],
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
         detail: {
            summary: "Create a new content request",
            description: "Generate a new content request with embedding for similarity analysis. The system will automatically generate embeddings for the topic and brief description to enable content similarity detection.",
            tags: [ApiTags.CONTENT_REQUESTS],
            responses: {
               201: {
                  description: "Content request created successfully",
               },
            },
         },
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
         response: {
            201: t.Object({
               request: _selectContentRequest,
            }),
         },
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
         detail: {
            summary: "Approve a content request",
            description: "Approve a pending content request and queue it for content generation. This will change the request status to 'approved' and trigger the content generation worker.",
            tags: [ApiTags.CONTENT_REQUESTS, ApiTags.CONTENT_MANAGEMENT],
            responses: {
               202: {
                  description: "Content request approved and queued for generation",
               },
               404: {
                  description: "Content request not found",
               },
            },
         },
         params: _contentRequestParams,
         response: {
            202: _approveRejectResponse,
            404: _errorResponse,
         },
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
         detail: {
            summary: "Reject a content request",
            description: "Reject a pending content request. This will change the request status to 'rejected' and prevent it from being processed for content generation.",
            tags: [ApiTags.CONTENT_REQUESTS, ApiTags.CONTENT_MANAGEMENT],
            responses: {
               200: {
                  description: "Content request rejected successfully",
               },
               404: {
                  description: "Content request not found",
               },
            },
         },
         params: _contentRequestParams,
         response: {
            200: _approveRejectResponse,
            404: _errorResponse,
         },
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
         detail: {
            summary: "List content requests",
            description: "Retrieve a paginated list of content requests for the authenticated user. Supports filtering by status (pending, approved, rejected) and includes pagination metadata.",
            tags: [ApiTags.CONTENT_REQUESTS],
            responses: {
               200: {
                  description: "List of content requests retrieved successfully",
               },
            },
         },
         query: _listContentRequestsQuery,
         response: {
            200: _listContentRequestsResponse,
         },
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
         detail: {
            summary: "Get content request details",
            description: "Retrieve detailed information about a specific content request, including any generated content associated with it. Only returns requests belonging to the authenticated user.",
            tags: [ApiTags.CONTENT_REQUESTS],
            responses: {
               200: {
                  description: "Content request details retrieved successfully",
               },
               404: {
                  description: "Content request not found or doesn't belong to user",
               },
            },
         },
         params: _contentRequestParams,
         response: {
            200: _contentRequestDetailsResponse,
            404: _errorResponse,
         },
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
         const { category, message } = categorizeSimilarity(maxSimilarity);

         return {
            similarRequests,
            similarity: maxSimilarity,
            category,
            message,
         };
      },
      {
         auth: true,
         detail: {
            summary: "Find similar content requests",
            description: "Analyze and find content requests similar to the specified request using vector embeddings. Returns similarity scores and categorizes the level of similarity (info, warning, error) to help identify potential duplicate or related content.",
            tags: [ApiTags.CONTENT_REQUESTS, ApiTags.AI_ANALYSIS],
            responses: {
               200: {
                  description: "Similar content requests found and analyzed",
               },
               404: {
                  description: "Content request not found or doesn't belong to user",
               },
            },
         },
         params: _contentRequestParams,
         response: {
            200: _similarityResponse,
            404: _errorResponse,
         },
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
         const { category, message } = categorizeSimilarity(maxSimilarity);

         return {
            similarContent,
            similarity: maxSimilarity,
            category,
            message,
         };
      },
      {
         auth: true,
         detail: {
            summary: "Find similar content",
            description: "Analyze and find content pieces similar to the specified content using vector embeddings. This helps identify duplicate content, related articles, or content that covers similar topics to avoid redundancy.",
            tags: [ApiTags.CONTENT, ApiTags.AI_ANALYSIS],
            responses: {
               200: {
                  description: "Similar content found and analyzed",
               },
               404: {
                  description: "Content not found or doesn't belong to user",
               },
            },
         },
         params: _contentParams,
         response: {
            200: _contentSimilarityResponse,
            404: _errorResponse,
         },
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
         detail: {
            summary: "Regenerate missing embeddings",
            description: "Batch regenerate vector embeddings for content requests and content that are missing embeddings. This is useful for data migration or when embedding generation previously failed. Returns statistics about the regeneration process.",
            tags: [ApiTags.AI_ANALYSIS, ApiTags.MAINTENANCE],
            responses: {
               200: {
                  description: "Embeddings regeneration completed successfully",
               },
               500: {
                  description: "Failed to regenerate embeddings",
               },
            },
         },
         response: {
            200: _regenerateEmbeddingsResponse,
            500: _errorResponse,
         },
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
         detail: {
            summary: "Generate embedding for specific content",
            description: "Generate or regenerate a vector embedding for a specific piece of content using its title and body. This enables similarity analysis and content relationship detection for the specified content.",
            tags: [ApiTags.CONTENT, ApiTags.AI_ANALYSIS],
            responses: {
               200: {
                  description: "Embedding generated successfully for the content",
               },
               404: {
                  description: "Content not found or doesn't belong to user",
               },
               500: {
                  description: "Failed to generate embedding",
               },
            },
         },
         params: _contentParams,
         response: {
            200: _generateEmbeddingResponse,
            404: _errorResponse,
            500: _errorResponse,
         },
      },
   );
