import { Elysia, t } from "elysia";
import { db } from "../integrations/database";
import { contentRequest, content } from "../schemas/content-schema";
import { createSelectSchema } from "drizzle-typebox";
import { authMiddleware } from "../integrations/auth";
import { categorizeSimilarity, embeddingService } from "../services/embedding";
import { and, desc, eq, gt, ne, sql, cosineDistance } from "drizzle-orm";

// OpenAPI Tags for route organization
enum ApiTags {
   AI_ANALYSIS = "Vector Analysis",
   MAINTENANCE = "Maintenance"
}

const _selectContentRequest = createSelectSchema(contentRequest);


// Specific schemas for different endpoints
const _contentRequestParams = t.Object({
   id: t.String({ format: "uuid" }),
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


const _regenerateEmbeddingsResponse = t.Object({
   message: t.String(),
   stats: t.Object({
      updatedRequests: t.Number(),
      updatedContent: t.Number(),
      totalRequests: t.Number(),
      totalContent: t.Number(),
   }),
});


const _errorResponse = t.Object({
   message: t.String(),
});

export const ContentAnalysisRoutes = new Elysia({
   prefix: "/ai",
   tags: [ApiTags.AI_ANALYSIS],
})
   .use(authMiddleware)
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

         // Check if there are other requests to compare against
         const totalUserRequests = await db.query.contentRequest.findMany({
            columns: { id: true },
            where: and(
               eq(contentRequest.userId, userId),
               ne(contentRequest.id, id)
            ),
            limit: 1,
         });

         // If no other requests exist, return appropriate response
         if (totalUserRequests.length === 0) {
            return {
               similarRequests: [],
               similarity: 0,
               category: "info" as const,
               message: "This is your only content request. Create more requests to see similarity analysis.",
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
            tags: [ApiTags.AI_ANALYSIS],
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
   );
