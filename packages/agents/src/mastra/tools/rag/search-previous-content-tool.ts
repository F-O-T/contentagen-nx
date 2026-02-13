import { createTool } from "@mastra/core/tools";
import { AppError, propagateError } from "@packages/utils/errors";
import { embed } from "ai";
import { z } from "zod";
import {
   CONTENT_CHUNKS_INDEX,
   CONTENT_METADATA_INDEX,
   embeddingModel,
   initializeRagService,
   isRagAvailable,
   ragService,
} from "../../rag/rag-service";
import type {
   ContentChunkMetadata,
   ContentMetadata,
   RelatedPost,
   RelevantChunk,
} from "../../rag/schemas";

export const searchPreviousContentTool = createTool({
   id: "search-previous-content",
   description:
      "Search previously published content for internal linking suggestions and context reference",
   inputSchema: z.object({
      query: z
         .string()
         .describe("Search query describing what content you're looking for"),
      mode: z
         .enum(["links", "context", "both"])
         .default("both")
         .describe(
            "Search mode: 'links' for post suggestions, 'context' for content chunks, 'both' for comprehensive search",
         ),
      limit: z
         .number()
         .min(1)
         .max(20)
         .optional()
         .describe("Maximum number of results to return"),
   }),
   execute: async (inputData, context) => {
      const { query, mode, limit } = inputData;
      const requestContext = context?.requestContext;

      if (!requestContext?.has("writerId")) {
         throw AppError.validation("Missing writerId in request context");
      }

      const writerId = requestContext.get("writerId") as string;

      if (!isRagAvailable()) {
         return {
            relatedPosts: [],
            relevantChunks: [],
            message: "RAG search not available - PG_VECTOR_URL not configured",
         };
      }

      try {
         // Initialize RAG service (lazy, only on first use)
         await initializeRagService();
         const store = ragService.getStore();

         // Create embedding for the query
         const { embedding } = await embed({
            model: embeddingModel,
            value: query,
         });

         const relatedPosts: RelatedPost[] = [];
         const relevantChunks: RelevantChunk[] = [];

         // Search metadata for links
         if (mode === "links" || mode === "both") {
            const metadataResults = await store.query({
               indexName: CONTENT_METADATA_INDEX,
               queryVector: embedding,
               topK: limit || 5,
               filter: { writerId: { $eq: writerId } },
               minScore: 0.4,
            });

            for (const result of metadataResults) {
               const metadata = result.metadata as unknown as ContentMetadata;
               relatedPosts.push({
                  slug: metadata.slug,
                  title: metadata.title,
                  description: metadata.description,
                  relevance: `${Math.round(result.score * 100)}%`,
               });
            }
         }

         // Search chunks for context
         if (mode === "context" || mode === "both") {
            const chunkResults = await store.query({
               indexName: CONTENT_CHUNKS_INDEX,
               queryVector: embedding,
               topK: limit || 10,
               filter: { writerId: { $eq: writerId } },
               minScore: 0.4,
            });

            for (const result of chunkResults) {
               const metadata =
                  result.metadata as unknown as ContentChunkMetadata;
               relevantChunks.push({
                  content: metadata.text,
                  relevance: `${Math.round(result.score * 100)}%`,
               });
            }
         }

         return {
            relatedPosts,
            relevantChunks,
            searchQuery: query,
            mode,
         };
      } catch (error) {
         console.error("Failed to search previous content:", error);
         propagateError(error);
         throw AppError.internal(
            `Failed to search previous content: ${(error as Error).message}`,
         );
      }
   },
});
