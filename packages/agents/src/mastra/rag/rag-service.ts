import { PgVector } from "@mastra/pg";
import { env } from "@packages/environment/server";
import { embed } from "ai";
import { embeddingModel } from "../agents/shared";
import type { ContentMetadata } from "./types";

// Index names (must follow PgVector naming: letters, numbers, underscores only)
export const CONTENT_METADATA_INDEX = "content_metadata";
export const CONTENT_CHUNKS_INDEX = "content_chunks";

// Embedding dimensions (text-embedding-3-small)
export const EMBEDDING_DIMENSION = 1536;

// Re-export embedding model for convenience
export { embeddingModel };

/**
 * RAG Service - Manages PgVector connection and provides core operations
 *
 * Uses lazy initialization to only connect when needed and
 * gracefully degrades when PG_VECTOR_URL is not configured.
 */
class RagService {
   private pgVector: PgVector | null = null;
   private initialized = false;
   private initializing = false;

   /**
    * Check if RAG is available (PG_VECTOR_URL configured)
    */
   isAvailable(): boolean {
      return !!env.PG_VECTOR_URL;
   }

   /**
    * Initialize the RAG service and create indexes if needed
    */
   async initialize(): Promise<void> {
      if (this.initialized || !this.isAvailable()) return;

      // Prevent concurrent initialization
      if (this.initializing) {
         // Wait for initialization to complete
         while (this.initializing) {
            await new Promise((resolve) => setTimeout(resolve, 50));
         }
         return;
      }

      this.initializing = true;

      try {
         this.pgVector = new PgVector({
            id: "mastra-rag",
            connectionString: env.PG_VECTOR_URL!,
         });

         // Create indexes if they don't exist
         await this.pgVector.createIndex({
            indexName: CONTENT_METADATA_INDEX,
            dimension: EMBEDDING_DIMENSION,
            metric: "cosine",
         });

         await this.pgVector.createIndex({
            indexName: CONTENT_CHUNKS_INDEX,
            dimension: EMBEDDING_DIMENSION,
            metric: "cosine",
         });

         this.initialized = true;
      } finally {
         this.initializing = false;
      }
   }

   /**
    * Get the PgVector store instance
    * @throws Error if not initialized
    */
   getStore(): PgVector {
      if (!this.pgVector) {
         throw new Error(
            "RAG service not initialized. Call initialize() first.",
         );
      }
      return this.pgVector;
   }

   /**
    * Disconnect from the database
    */
   async disconnect(): Promise<void> {
      if (this.pgVector) {
         await this.pgVector.disconnect();
         this.pgVector = null;
         this.initialized = false;
      }
   }
}

// Singleton instance
export const ragService = new RagService();

// Convenience exports
export const initializeRagService = () => ragService.initialize();
export const isRagAvailable = () => ragService.isAvailable();

/**
 * Search result from similarity search
 */
export interface SimilarContentResult {
   externalId: string;
   title: string;
   description: string;
   slug: string;
   relevance: number;
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
   if (!ragService.isAvailable()) {
      return [];
   }

   await ragService.initialize();
   const store = ragService.getStore();

   // Create embedding for the query
   const { embedding } = await embed({
      model: embeddingModel,
      value: params.query,
   });

   // Query the metadata index
   const results = await store.query({
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
