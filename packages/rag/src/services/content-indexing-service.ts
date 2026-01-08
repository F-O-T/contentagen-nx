import { AppError, propagateError } from "@packages/utils/errors";
import type { PgVectorDatabaseInstance } from "../client";
import { chunkText } from "../helpers";
import {
   createContentChunksWithEmbeddings,
   createContentMetadataWithEmbedding,
   deleteContentRagByExternalId,
   isContentIndexed,
} from "../repositories/content-rag-repository";

export interface ContentToIndex {
   id: string; // content.id
   agentId: string;
   slug: string;
   title: string;
   description: string;
   keywords?: string[];
   body: string;
}

export interface IndexingResult {
   contentId: string;
   metadataIndexed: boolean;
   chunksIndexed: number;
}

/**
 * Index published content for RAG
 *
 * Creates embeddings for:
 * 1. Content metadata (title, description, keywords) - for internal linking
 * 2. Content body chunks - for context and consistency
 */
export async function indexPublishedContent(
   dbClient: PgVectorDatabaseInstance,
   content: ContentToIndex,
): Promise<IndexingResult> {
   try {
      // Check if already indexed (avoid duplicates)
      const alreadyIndexed = await isContentIndexed(dbClient, content.id);
      if (alreadyIndexed) {
         // Re-index: delete old and create new
         await deleteContentRagByExternalId(dbClient, content.id);
      }

      // 1. Index metadata
      await createContentMetadataWithEmbedding(dbClient, {
         externalId: content.id,
         agentId: content.agentId,
         slug: content.slug,
         title: content.title,
         description: content.description,
         keywords: content.keywords,
      });

      // 2. Chunk and index body
      const chunks = chunkText(content.body, {
         chunkSize: 1500, // ~400 tokens
         overlap: 200,
      });

      let chunksIndexed = 0;
      if (chunks.length > 0) {
         const indexedChunks = await createContentChunksWithEmbeddings(
            dbClient,
            chunks,
            {
               externalId: content.id,
               agentId: content.agentId,
            },
         );
         chunksIndexed = indexedChunks.length;
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
export async function removeContentFromIndex(
   dbClient: PgVectorDatabaseInstance,
   contentId: string,
): Promise<{ metadataDeleted: number; chunksDeleted: number }> {
   try {
      return await deleteContentRagByExternalId(dbClient, contentId);
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
   dbClient: PgVectorDatabaseInstance,
   contentItems: ContentToIndex[],
): Promise<IndexingResult[]> {
   const results: IndexingResult[] = [];

   for (const content of contentItems) {
      try {
         const result = await indexPublishedContent(dbClient, content);
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
