import { z } from "zod";

export const contentToIndexSchema = z.object({
   id: z.string().describe("content.id (externalId for vectors)"),
   writerId: z.string().describe("For filtering by agent"),
   slug: z.string(),
   title: z.string(),
   description: z.string(),
   keywords: z.array(z.string()).optional(),
   body: z.string(),
});
export type ContentToIndex = z.infer<typeof contentToIndexSchema>;

export const indexingResultSchema = z.object({
   contentId: z.string(),
   metadataIndexed: z.boolean(),
   chunksIndexed: z.number(),
});
export type IndexingResult = z.infer<typeof indexingResultSchema>;

export const contentMetadataSchema = z.object({
   externalId: z.string(),
   writerId: z.string(),
   slug: z.string(),
   title: z.string(),
   description: z.string(),
   keywords: z.array(z.string()).optional(),
   text: z.string(),
   type: z.literal("metadata"),
});
export type ContentMetadata = z.infer<typeof contentMetadataSchema>;

export const contentChunkMetadataSchema = z.object({
   externalId: z.string(),
   writerId: z.string(),
   chunkIndex: z.number(),
   text: z.string(),
   type: z.literal("chunk"),
});
export type ContentChunkMetadata = z.infer<typeof contentChunkMetadataSchema>;

export const relatedPostSchema = z.object({
   slug: z.string(),
   title: z.string(),
   description: z.string(),
   relevance: z.string(),
});
export type RelatedPost = z.infer<typeof relatedPostSchema>;

export const relevantChunkSchema = z.object({
   content: z.string(),
   relevance: z.string(),
});
export type RelevantChunk = z.infer<typeof relevantChunkSchema>;

export const searchModeSchema = z.enum(["links", "context", "both"]);
export type SearchMode = z.infer<typeof searchModeSchema>;

export const similarContentResultSchema = z.object({
   externalId: z.string(),
   title: z.string(),
   description: z.string(),
   slug: z.string(),
   relevance: z.number(),
});
export type SimilarContentResult = z.infer<typeof similarContentResultSchema>;
