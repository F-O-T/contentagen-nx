import { embed } from "ai";
import { embeddingModel, pgVectorStore } from "../../utils";
import type { ContentMetadata, SimilarContentResult } from "./schemas";

// Index names (must follow PgVector naming: letters, numbers, underscores only)
export const CONTENT_METADATA_INDEX = "content_metadata";
export const CONTENT_CHUNKS_INDEX = "content_chunks";

// Embedding dimensions (text-embedding-3-small)
export const EMBEDDING_DIMENSION = 1536;

// Re-export for convenience
export { embeddingModel };

let initialized = false;

/**
 * Initialize RAG indexes (call once at startup)
 */
export async function initializeRagService(): Promise<void> {
   if (initialized) return;

   await pgVectorStore.createIndex({
      indexName: CONTENT_METADATA_INDEX,
      dimension: EMBEDDING_DIMENSION,
      metric: "cosine",
   });

   await pgVectorStore.createIndex({
      indexName: CONTENT_CHUNKS_INDEX,
      dimension: EMBEDDING_DIMENSION,
      metric: "cosine",
   });

   initialized = true;
}

/**
 * Search for similar content based on a query string
 * This is a simplified API for direct usage from tRPC endpoints
 */
export async function searchSimilarContent(params: {
   query: string;
   writerId: string;
   limit?: number;
   minScore?: number;
}): Promise<SimilarContentResult[]> {
   await initializeRagService();

   // Create embedding for the query
   const { embedding } = await embed({
      model: embeddingModel,
      value: params.query,
   });

   // Query the metadata index
   const results = await pgVectorStore.query({
      indexName: CONTENT_METADATA_INDEX,
      queryVector: embedding,
      topK: params.limit || 5,
      filter: { writerId: { $eq: params.writerId } },
      minScore: params.minScore || 0.5,
   });

   return results.map((r) => {
      const metadata = r.metadata as unknown as ContentMetadata;
      return {
         externalId: metadata.externalId,
         title: metadata.title,
         description: metadata.description,
         slug: metadata.slug,
         relevance: r.score,
      };
   });
}

export const ragService = {
   getStore: () => pgVectorStore,
   isAvailable: () => true,
   initialize: initializeRagService,
};

export const isRagAvailable = () => true;
