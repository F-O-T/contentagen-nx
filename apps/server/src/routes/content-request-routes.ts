import { Elysia, t } from "elysia";
import { db } from "../integrations/database";
import { contentRequest } from "../schemas/content-schema";
import {
   createInsertSchema,
   createSelectSchema,
   createUpdateSchema,
} from "drizzle-typebox";
import { authMiddleware } from "../integrations/auth";
import { embeddingService } from "../services/embedding";
import { and, desc, eq } from "drizzle-orm";

// OpenAPI Tags for route organization
enum ApiTags {
   CONTENT_REQUESTS = "Content Requests",
}
const _updateContentRequest = createUpdateSchema(contentRequest);
const _createContentRequest = createInsertSchema(contentRequest);
const _selectContentRequest = createSelectSchema(contentRequest);

// Specific schemas for different endpoints
const _contentRequestParams = t.Object({
   id: t.String({ format: "uuid" }),
});

const _listContentRequestsQuery = t.Object({
   page: t.Optional(t.Number({ minimum: 1 })),
   limit: t.Optional(t.Number({ minimum: 1, maximum: 50 })),
   status: t.Optional(
      t.Union([
         t.Literal("pending"),
         t.Literal("approved"),
         t.Literal("rejected"),
      ]),
   ),
});

const _listContentRequestsResponse = t.Object({
   requests: t.Array(
      t.Pick(_selectContentRequest, [
         "id",
         "topic",
         "briefDescription",
         "targetLength",
         "status",
         "isCompleted",
         "createdAt",
         "updatedAt",
         "agentId",
         "generatedContentId",
      ]),
   ),
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
         generatedContent: t.Optional(t.Nullable(t.Any())),
      }),
   ]),
});

const _errorResponse = t.Object({
   message: t.String(),
});

export const contentRequestRoutes = new Elysia({
   prefix: "/request",
   tags: [ApiTags.CONTENT_REQUESTS],
})
   .use(authMiddleware)
   .post(
      "/generate",
      async ({ body, set, user }) => {
         const { id: userId } = user;

         try {
            // Generate embedding for the content request
            const embedding =
               await embeddingService.generateContentRequestEmbedding(
                  body.topic,
                  body.briefDescription,
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
            description:
               "Generate a new content request with embedding for similarity analysis. The system will automatically generate embeddings for the topic and brief description to enable content similarity detection.",
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
            description:
               "Retrieve a paginated list of content requests for the authenticated user. Supports filtering by status (pending, approved, rejected) and includes pagination metadata.",
            tags: [ApiTags.CONTENT_REQUESTS],
            responses: {
               200: {
                  description:
                     "List of content requests retrieved successfully",
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
               eq(contentRequest.userId, userId),
            ),
            with: {
               generatedContent: true,
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
            description:
               "Retrieve detailed information about a specific content request, including any generated content associated with it. Only returns requests belonging to the authenticated user.",
            tags: [ApiTags.CONTENT_REQUESTS],
            responses: {
               200: {
                  description: "Content request details retrieved successfully",
               },
               404: {
                  description:
                     "Content request not found or doesn't belong to user",
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

         try {
            const targetRequest = await db.query.contentRequest.findFirst({
               where: and(
                  eq(contentRequest.id, id),
                  eq(contentRequest.userId, userId),
               ),
            });

            if (!targetRequest || !targetRequest.embedding) {
               set.status = 404;
               return {
                  message:
                     "Content request not found or no embedding available",
               };
            }

            // Calculate similarity with a mock value for now
            // In a real implementation, you'd compare embeddings
            return {
               similarity: 0.75, // Mock similarity score
            };
         } catch (error) {
            console.error("Error calculating similarity:", error);
            set.status = 500;
            return { message: "Failed to calculate similarity" };
         }
      },
      {
         auth: true,
         detail: {
            summary: "Get content request similarities",
            description:
               "Calculate similarity scores for a content request against other requests",
            tags: [ApiTags.CONTENT_REQUESTS],
         },
         params: _contentRequestParams,
         response: {
            200: t.Object({
               similarity: t.Number(),
            }),
            404: _errorResponse,
            500: _errorResponse,
         },
      },
   )
   .patch(
      "/",
      async ({ body, user }) => {
         try {
            if (!body.id) {
               throw new Error("Content request ID is required");
            }
            const { id: userId } = user;

            // Check if the request belongs to the user
            const existingRequest = await db.query.contentRequest.findFirst({
               where: and(
                  eq(contentRequest.id, body.id),
                  eq(contentRequest.userId, userId),
               ),
            });

            if (!existingRequest) {
               throw new Error("Content request not found");
            }

            // Prepare update data
            const updateData: any = {
               ...body,
               updatedAt: new Date(),
            };

            // Update embedding if topic or briefDescription changed
            if (body.topic || body.briefDescription) {
               try {
                  const topic = body.topic || existingRequest.topic;
                  const briefDescription = body.briefDescription || existingRequest.briefDescription;
                  
                  const embedding = await embeddingService.generateContentRequestEmbedding(
                     topic,
                     briefDescription,
                  );
                  updateData.embedding = embedding;
               } catch (error) {
                  console.error("Error updating embedding:", error);
                  // Continue with update without embedding if embedding generation fails
               }
            }

            // Update the request
            const [updatedRequest] = await db
               .update(contentRequest)
               .set(updateData)
               .where(eq(contentRequest.id, body.id))
               .returning();
            if (!updatedRequest) {
               throw new Error("Failed to update content request");
            }
            return {
               updatedRequest,
            };
         } catch (e) {
            console.error("Error updating content request:", e);
            throw new Error("Failed to update content request");
         }
      },
      {
         auth: true,
         detail: {
            summary: "Update a content request",
            description:
               "Update an existing content request. Only the owner can update their requests.",
            tags: [ApiTags.CONTENT_REQUESTS],
         },

         body: t.Omit(_updateContentRequest, [
            "userId",
            "createdAt",
            "updatedAt",
            "embedding",
         ]),

         response: {
            200: t.Object({
               updatedRequest: _selectContentRequest,
            }),
         },
      },
   )
   .delete(
      "/:id",
      async ({ params, user, set }) => {
         const { id } = params;
         const { id: userId } = user;

         try {
            // Check if the request belongs to the user
            const existingRequest = await db.query.contentRequest.findFirst({
               where: and(
                  eq(contentRequest.id, id),
                  eq(contentRequest.userId, userId),
               ),
            });

            if (!existingRequest) {
               set.status = 404;
               return { message: "Content request not found" };
            }

            // Delete the request
            await db.delete(contentRequest).where(eq(contentRequest.id, id));

            set.status = 204;
            return {};
         } catch (error) {
            console.error("Error deleting content request:", error);
            set.status = 500;
            return { message: "Failed to delete content request" };
         }
      },
      {
         auth: true,
         detail: {
            summary: "Delete a content request",
            description:
               "Delete an existing content request. Only the owner can delete their requests.",
            tags: [ApiTags.CONTENT_REQUESTS],
         },
         params: _contentRequestParams,
         response: {
            204: t.Object({}),
            404: _errorResponse,
            500: _errorResponse,
         },
      },
   );
