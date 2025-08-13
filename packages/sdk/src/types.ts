import { z } from "zod";

// Content-related schemas and types (extracted from database package)
export const ContentStatsSchema = z.object({
   wordsCount: z
      .string()
      .optional()
      .describe("The number of words in the content."),
   readTimeMinutes: z
      .string()
      .optional()
      .describe("Estimated reading time in minutes."),
   qualityScore: z
      .string()
      .optional()
      .describe("A score representing the quality of the content."),
});

export const ContentMetaSchema = z.object({
   title: z.string().optional().describe("The title of the content."),
   slug: z
      .string()
      .optional()
      .describe("A URL-friendly identifier for the content."),
   tags: z
      .array(z.string())
      .optional()
      .describe("Tags associated with the content."),
   topics: z
      .array(z.string())
      .optional()
      .describe("Topics covered in the content."),
   sources: z
      .array(z.string())
      .optional()
      .describe("Sources referenced for the content."),
});

export const ContentRequestSchema = z.object({
   description: z.string().min(1, "Description is required"),
});

// Content status enum values
export const ContentStatusValues = ["draft", "approved", "generating"] as const;

// Input schemas for API calls
export const ListContentByAgentInputSchema = z.object({
   status: z
      .enum(ContentStatusValues, {
         message:
            "Invalid content status. Must be one of: draft, approved, generating.",
      })
      .array(),
   agentId: z.uuid("Invalid Agent ID format."),
   limit: z.number().min(1).max(100).optional().default(10),
   page: z.number().min(1).optional().default(1),
});

export const GetContentByIdInputSchema = z.object({
   id: z.uuid("Invalid Content ID format."),
});

export const GetContentBySlugInputSchema = z.object({
   slug: z.string().min(1, "Slug is required."),
});

// Content select schema and type
export const ContentSelectSchema = z.object({
   id: z.string(),
   agentId: z.string(),
   imageUrl: z.string().nullable(),
   userId: z.string(),
   body: z.string(),
   status: z.enum(ContentStatusValues),
   meta: ContentMetaSchema,
   request: ContentRequestSchema,
   stats: ContentStatsSchema,
   createdAt: z.date(),
   updatedAt: z.date(),
});

export const ContentListResponseSchema = z.object({
   posts: ContentSelectSchema.pick({
      id: true,
      meta: true,
      imageUrl: true,
      status: true,
   }).array(),
   total: z.number(),
});
export type ContentList = z.infer<typeof ContentListResponseSchema>;
// Exported types
export type ContentStats = z.infer<typeof ContentStatsSchema>;
export type ContentMeta = z.infer<typeof ContentMetaSchema>;
export type ContentRequest = z.infer<typeof ContentRequestSchema>;
export type ContentStatus = (typeof ContentStatusValues)[number];
export type ContentSelect = z.infer<typeof ContentSelectSchema>;
