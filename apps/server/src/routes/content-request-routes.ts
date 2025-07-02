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
import { enqueueContentRequest } from "../services/worker-enqueue";
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

// Schema for creating content request (omitting tags field)
const _createContentRequestBody = t.Omit(_createContentRequest, [
   "id",
   "userId",
   "createdAt",
   "updatedAt",
   "embedding",
   "tags",
   "status",
   "isCompleted",
   "generatedContentId",
]);

export const contentRequestRoutes = new Elysia({
   prefix: "/request",
   tags: [ApiTags.CONTENT_REQUESTS],
})
   .use(authMiddleware)
   .post(
      "/",
      async ({ body, user, set }) => {
         try {
            const { id: userId } = user;

            const [newRequest] = await db
               .insert(contentRequest)
               .values({
                  ...body,
                  userId,
               })
               .returning();

            if (!newRequest) {
               throw new Error("Failed to create content request");
            }

            // Enqueue the content request for processing
            await enqueueContentRequest({
               requestId: newRequest.id,
               approved: false,
               isCompleted: false,
            });

            set.status = 201;
            return {
               request: newRequest,
            };
         } catch (error) {
            console.error("Error creating content request:", error);
            set.status = 400;
            return {
               message: "Failed to create content request",
            };
         }
      },
      {
         auth: true,
         detail: {
            summary: "Create a content request",
            description:
               "Create a new content request that will be processed by the system. The request includes topic, description, and various formatting options. Once created, it triggers the content generation workflow where an assigned agent will process the request and generate the requested content.",
            tags: [ApiTags.CONTENT_REQUESTS],
            responses: {
               201: {
                  description: "Content request created successfully",
               },
               400: {
                  description: "Invalid request data or creation failed",
               },
            },
         },
         body: _createContentRequestBody,
         response: {
            201: t.Object({
               request: _selectContentRequest,
            }),
            400: _errorResponse,
         },
      },
   )
   .get(
      "/list",
      async ({ user, query }) => {
         const { id: userId } = user;
         const { page = 1, limit = 10 } = query;
         const offset = (page - 1) * limit;

         const whereClause = eq(contentRequest.userId, userId);

         const requests = await db.query.contentRequest.findMany({
            columns: {
               id: true,
               topic: true,
               briefDescription: true,
               targetLength: true,
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

            // Validate and extract the new fields, preserving existing values if not provided
            const validatedUpdateData: any = {
               ...body,

               internalLinkFormat:
                  body.internalLinkFormat !== undefined
                     ? body.internalLinkFormat
                     : existingRequest.internalLinkFormat,
               includeMetaTags:
                  body.includeMetaTags !== undefined
                     ? body.includeMetaTags
                     : existingRequest.includeMetaTags,
               includeMetaDescription:
                  body.includeMetaDescription !== undefined
                     ? body.includeMetaDescription
                     : existingRequest.includeMetaDescription,

               approved:
                  body.approved !== undefined
                     ? body.approved
                     : existingRequest.approved,
               updatedAt: new Date(),
            };

            // Update embedding if topic or briefDescription changed
            if (body.topic || body.briefDescription) {
               try {
                  const topic = body.topic || existingRequest.topic;
                  const briefDescription =
                     body.briefDescription || existingRequest.briefDescription;

                  const embedding =
                     await embeddingService.generateContentRequestEmbedding(
                        topic,
                        briefDescription,
                     );
                  validatedUpdateData.embedding = embedding;
               } catch (error) {
                  console.error("Error updating embedding:", error);
                  // Continue with update without embedding if embedding generation fails
               }
            }

            // Update the request
            const [updatedRequest] = await db
               .update(contentRequest)
               .set(validatedUpdateData)
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
               "Update an existing content request. Only the owner can update their requests. Supports updating all content generation options including tag generation, meta tags, internal link formatting, and frontmatter formatting.",
            tags: [ApiTags.CONTENT_REQUESTS],
            parameters: [
               {
                  name: "generateTags",
                  in: "body",
                  description:
                     "Whether to automatically generate tags for the content",
                  required: false,
                  schema: { type: "boolean" },
               },
               {
                  name: "tags",
                  in: "body",
                  description: "Array of predefined tags for the content",
                  required: false,
                  schema: { type: "array", items: { type: "string" } },
               },
               {
                  name: "internalLinkFormat",
                  in: "body",
                  description: "Format for internal links: 'mdx' or 'html'",
                  required: false,
                  schema: { type: "string", enum: ["mdx", "html"] },
               },
               {
                  name: "includeMetaTags",
                  in: "body",
                  description:
                     "Whether to include meta tags in the generated content",
                  required: false,
                  schema: { type: "boolean" },
               },
               {
                  name: "includeMetaDescription",
                  in: "body",
                  description:
                     "Whether to include meta description in the generated content",
                  required: false,
                  schema: { type: "boolean" },
               },
               {
                  name: "frontmatterFormatting",
                  in: "body",
                  description: "Whether to format output with YAML frontmatter",
                  required: false,
                  schema: { type: "boolean" },
               },
               {
                  name: "approved",
                  in: "body",
                  description:
                     "Whether the content request is approved for generation",
                  required: false,
                  schema: { type: "boolean" },
               },
            ],
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
