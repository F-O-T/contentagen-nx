import { MDocument } from "@mastra/rag";
import { AppError, propagateError } from "@packages/utils/errors";
import { embed, embedMany } from "ai";
import { pgVectorStore } from "../../utils";
import {
   CONTENT_CHUNKS_INDEX,
   CONTENT_METADATA_INDEX,
   embeddingModel,
   initializeRagService,
} from "./rag-service";
import type {
   ContentChunkMetadata,
   ContentMetadata,
   ContentToIndex,
   IndexingResult,
} from "./schemas";

// Chunk configuration
const CHUNK_SIZE = 512; // Characters per chunk
const CHUNK_OVERLAP = 50; // Overlap between chunks

/**
 * Index content for RAG search
 *
 * Creates embeddings for:
 * 1. Content metadata (title, description, keywords) - for internal linking
 * 2. Content body chunks - for context and consistency
 */
export async function indexContent(
   content: ContentToIndex,
): Promise<IndexingResult> {
   try {
      await initializeRagService();
      const store = pgVectorStore;

      // Remove existing vectors first (re-index)
      await removeContent(content.id);

      // 1. Create metadata embedding
      const metadataText = [
         content.title,
         content.description,
         content.keywords?.join(", ") || "",
      ]
         .filter(Boolean)
         .join(" | ");

      const { embedding: metadataEmbedding } = await embed({
         model: embeddingModel,
         value: metadataText,
      });

      const metadataRecord: ContentMetadata = {
         externalId: content.id,
         writerId: content.writerId,
         slug: content.slug,
         title: content.title,
         description: content.description,
         keywords: content.keywords,
         text: metadataText,
         type: "metadata",
      };

      await store.upsert({
         indexName: CONTENT_METADATA_INDEX,
         vectors: [metadataEmbedding],
         metadata: [metadataRecord],
         ids: [`metadata_${content.id}`],
      });

      // 2. Chunk and embed body content
      let chunksIndexed = 0;
      if (content.body && content.body.trim().length > 0) {
         const doc = MDocument.fromText(content.body);
         const chunks = await doc.chunk({
            strategy: "recursive",
            maxSize: CHUNK_SIZE,
            overlap: CHUNK_OVERLAP,
         });

         if (chunks.length > 0) {
            const chunkTexts = chunks.map((c) => c.text);
            const { embeddings } = await embedMany({
               model: embeddingModel,
               values: chunkTexts,
            });

            const chunkMetadata: ContentChunkMetadata[] = chunks.map(
               (chunk, i) => ({
                  externalId: content.id,
                  writerId: content.writerId,
                  chunkIndex: i,
                  text: chunk.text,
                  type: "chunk" as const,
               }),
            );

            await store.upsert({
               indexName: CONTENT_CHUNKS_INDEX,
               vectors: embeddings,
               metadata: chunkMetadata,
               ids: chunks.map((_, i) => `chunk_${content.id}_${i}`),
            });

            chunksIndexed = chunks.length;
         }
      }

      return {
         contentId: content.id,
         metadataIndexed: true,
         chunksIndexed,
      };
   } catch (err) {
      propagateError(err);
      throw AppError.internal(
         `Failed to index content: ${(err as Error).message}`,
      );
   }
}

/**
 * Remove content from RAG index
 *
 * Call when content is unpublished, archived, or deleted
 */
export async function removeContent(contentId: string): Promise<void> {
   try {
      await initializeRagService();
      const store = pgVectorStore;

      // Delete metadata vector
      try {
         await store.deleteVectors({
            indexName: CONTENT_METADATA_INDEX,
            filter: { externalId: { $eq: contentId } },
         });
      } catch {
         // Ignore if doesn't exist
      }

      // Delete chunk vectors
      try {
         await store.deleteVectors({
            indexName: CONTENT_CHUNKS_INDEX,
            filter: { externalId: { $eq: contentId } },
         });
      } catch {
         // Ignore if doesn't exist
      }
   } catch (err) {
      propagateError(err);
      throw AppError.internal(
         `Failed to remove content from index: ${(err as Error).message}`,
      );
   }
}

/**
 * Batch index multiple content items
 * Useful for initial indexing of existing published content
 */
export async function batchIndexContent(
   contents: ContentToIndex[],
): Promise<IndexingResult[]> {
   const results: IndexingResult[] = [];

   for (const content of contents) {
      try {
         const result = await indexContent(content);
         results.push(result);
      } catch (err) {
         console.error(`Failed to index content ${content.id}:`, err);
         results.push({
            contentId: content.id,
            metadataIndexed: false,
            chunksIndexed: 0,
         });
      }
   }

   return results;
}
