import { Elysia, t } from "elysia";
import { db } from "../integrations/database";
import { content } from "../schemas/content-schema";
import { createInsertSchema, createSelectSchema } from "drizzle-typebox";
import { authMiddleware } from "../integrations/auth";
import { embeddingService } from "../services/embedding";

enum ApiTags {
   CONTENT_REQUESTS = "Content Requests",
}

const _createContentRequest = createInsertSchema(content);
const _selectContentRequest = createSelectSchema(content);

// Exported route
export const generatedRequestRoutes = new Elysia({
   prefix: "/request",
   tags: [ApiTags.CONTENT_REQUESTS],
})
   .use(authMiddleware)
   .post(
      "/generate",
      async ({ body, set, user }) => {
         const { id: userId } = user;

         try {
            // Validate and extract the new fields with proper defaults
            const validatedBody = {
               ...body,
               generateTags: body.generateTags ?? false,
               tags: body.tags ?? [],
               internalLinkFormat: body.internalLinkFormat ?? "mdx",
               includeMetaTags: body.includeMetaTags ?? false,
               includeMetaDescription: body.includeMetaDescription ?? false,
               frontmatterFormatting: body.frontmatterFormatting ?? false,
               approved: body.approved ?? true,
            };

            // Generate embedding for the content request
            const embedding =
               await embeddingService.generateContentRequestEmbedding(
                  validatedBody.topic,
                  validatedBody.briefDescription,
               );

            const [request] = await db
               .insert(contentRequest)
               .values({
                  ...validatedBody,
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
            const validatedBody = {
               ...body,
               generateTags: body.generateTags ?? false,
               tags: body.tags ?? [],
               internalLinkFormat: body.internalLinkFormat ?? "mdx",
               includeMetaTags: body.includeMetaTags ?? false,
               includeMetaDescription: body.includeMetaDescription ?? false,
               frontmatterFormatting: body.frontmatterFormatting ?? false,
               approved: body.approved ?? true,
            };

            const [request] = await db
               .insert(contentRequest)
               .values({
                  ...validatedBody,
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
               "Generate a new content request with embedding for similarity analysis. The system will automatically generate embeddings for the topic and brief description to enable content similarity detection. Supports advanced content generation options including tag generation, meta tags, internal link formatting, and frontmatter formatting.",
            tags: [ApiTags.CONTENT_REQUESTS],
            parameters: [
               {
                  name: "generateTags",
                  in: "body",
                  description:
                     "Whether to automatically generate tags for the content (default: false)",
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
                  description:
                     "Format for internal links: 'mdx' or 'html' (default: 'mdx')",
                  required: false,
                  schema: { type: "string", enum: ["mdx", "html"] },
               },
               {
                  name: "includeMetaTags",
                  in: "body",
                  description:
                     "Whether to include meta tags in the generated content (default: false)",
                  required: false,
                  schema: { type: "boolean" },
               },
               {
                  name: "includeMetaDescription",
                  in: "body",
                  description:
                     "Whether to include meta description in the generated content (default: false)",
                  required: false,
                  schema: { type: "boolean" },
               },
               {
                  name: "frontmatterFormatting",
                  in: "body",
                  description:
                     "Whether to format output with YAML frontmatter (default: false)",
                  required: false,
                  schema: { type: "boolean" },
               },
               {
                  name: "approved",
                  in: "body",
                  description:
                     "Whether the content request is approved for generation (default: true)",
                  required: false,
                  schema: { type: "boolean" },
               },
            ],
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
   );

