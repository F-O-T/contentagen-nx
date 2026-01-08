import { AppError, propagateError } from "@packages/utils/errors";
import { and, cosineDistance, desc, eq, gt, ne, sql } from "drizzle-orm";
import type { PgVectorDatabaseInstance } from "../client";
import { createEmbedding, createEmbeddings } from "../helpers";
import {
   type ContentChunksRagInsert,
   type ContentMetadataRagInsert,
   contentChunksRag,
   contentMetadataRag,
} from "../schemas/content-rag-schema";

// ============================================================================
// Metadata Operations
// ============================================================================

async function createContentMetadata(
   dbClient: PgVectorDatabaseInstance,
   data: ContentMetadataRagInsert,
) {
   try {
      const result = await dbClient
         .insert(contentMetadataRag)
         .values(data)
         .returning();
      return result[0];
   } catch (err) {
      throw AppError.database(
         `Failed to create content metadata: ${(err as Error).message}`,
      );
   }
}

export async function createContentMetadataWithEmbedding(
   dbClient: PgVectorDatabaseInstance,
   data: Omit<
      ContentMetadataRagInsert,
      "embedding" | "id" | "createdAt" | "updatedAt"
   >,
) {
   try {
      // Create combined text for embedding: title + description + keywords
      const embeddingText = [
         data.title,
         data.description,
         data.keywords?.join(", ") || "",
      ]
         .filter(Boolean)
         .join(" | ");

      const { embedding } = await createEmbedding(embeddingText);
      return await createContentMetadata(dbClient, {
         ...data,
         embedding,
      });
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to create content metadata with embedding: ${(err as Error).message}`,
      );
   }
}

// ============================================================================
// Chunks Operations
// ============================================================================

export async function createContentChunksWithEmbeddings(
   dbClient: PgVectorDatabaseInstance,
   chunks: string[],
   metadata: { externalId: string; agentId: string },
) {
   try {
      if (chunks.length === 0) {
         return [];
      }

      const embeddings = await createEmbeddings(chunks);

      const insertData: ContentChunksRagInsert[] = [];

      for (let i = 0; i < chunks.length; i++) {
         const embedding = embeddings[i];
         if (!embedding) {
            console.warn(`Skipping chunk ${i} - embedding failed`);
            continue;
         }

         insertData.push({
            externalId: metadata.externalId,
            agentId: metadata.agentId,
            chunkIndex: i,
            chunk: chunks[i] as string,
            embedding,
         });
      }

      if (insertData.length === 0) {
         return [];
      }

      const result = await dbClient
         .insert(contentChunksRag)
         .values(insertData)
         .returning();

      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to create content chunks with embeddings: ${(err as Error).message}`,
      );
   }
}

// ============================================================================
// Delete Operations
// ============================================================================

export async function deleteContentRagByExternalId(
   dbClient: PgVectorDatabaseInstance,
   externalId: string,
): Promise<{ metadataDeleted: number; chunksDeleted: number }> {
   try {
      const [metadataResult, chunksResult] = await Promise.all([
         dbClient
            .delete(contentMetadataRag)
            .where(eq(contentMetadataRag.externalId, externalId))
            .returning({ id: contentMetadataRag.id }),
         dbClient
            .delete(contentChunksRag)
            .where(eq(contentChunksRag.externalId, externalId))
            .returning({ id: contentChunksRag.id }),
      ]);

      return {
         metadataDeleted: metadataResult.length,
         chunksDeleted: chunksResult.length,
      };
   } catch (err) {
      throw AppError.database(
         `Failed to delete content RAG by external ID: ${(err as Error).message}`,
      );
   }
}

// ============================================================================
// Search Operations
// ============================================================================

interface SearchOptions {
   limit?: number;
   similarityThreshold?: number;
   excludeExternalId?: string; // Exclude current content from results
}

/**
 * Search content metadata by text query
 * Returns related content for internal linking suggestions
 */
export async function searchContentMetadataByText(
   dbClient: PgVectorDatabaseInstance,
   queryText: string,
   agentId: string,
   options: SearchOptions = {},
) {
   try {
      const {
         limit = 5,
         similarityThreshold = 0.5,
         excludeExternalId,
      } = options;
      const { embedding: queryEmbedding } = await createEmbedding(queryText);

      const similarity = sql<number>`1 - (${cosineDistance(contentMetadataRag.embedding, queryEmbedding)})`;

      const conditions = [
         eq(contentMetadataRag.agentId, agentId),
         gt(similarity, similarityThreshold),
      ];

      if (excludeExternalId) {
         conditions.push(ne(contentMetadataRag.externalId, excludeExternalId));
      }

      const result = await dbClient
         .select({
            externalId: contentMetadataRag.externalId,
            slug: contentMetadataRag.slug,
            title: contentMetadataRag.title,
            description: contentMetadataRag.description,
            keywords: contentMetadataRag.keywords,
            similarity,
         })
         .from(contentMetadataRag)
         .where(and(...conditions))
         .orderBy(desc(similarity))
         .limit(limit);

      return result;
   } catch (err) {
      throw AppError.database(
         `Failed to search content metadata: ${(err as Error).message}`,
      );
   }
}

/**
 * Search content chunks by text query
 * Returns specific content passages for context
 */
export async function searchContentChunksByText(
   dbClient: PgVectorDatabaseInstance,
   queryText: string,
   agentId: string,
   options: SearchOptions = {},
) {
   try {
      const {
         limit = 10,
         similarityThreshold = 0.5,
         excludeExternalId,
      } = options;
      const { embedding: queryEmbedding } = await createEmbedding(queryText);

      const similarity = sql<number>`1 - (${cosineDistance(contentChunksRag.embedding, queryEmbedding)})`;

      const conditions = [
         eq(contentChunksRag.agentId, agentId),
         gt(similarity, similarityThreshold),
      ];

      if (excludeExternalId) {
         conditions.push(ne(contentChunksRag.externalId, excludeExternalId));
      }

      const result = await dbClient
         .select({
            externalId: contentChunksRag.externalId,
            chunkIndex: contentChunksRag.chunkIndex,
            chunk: contentChunksRag.chunk,
            similarity,
         })
         .from(contentChunksRag)
         .where(and(...conditions))
         .orderBy(desc(similarity))
         .limit(limit);

      return result;
   } catch (err) {
      throw AppError.database(
         `Failed to search content chunks: ${(err as Error).message}`,
      );
   }
}

export type SearchMode = "links" | "context" | "both";

interface RelatedContentResult {
   // For internal linking
   relatedPosts: Array<{
      externalId: string;
      slug: string;
      title: string;
      description: string;
      similarity: number;
   }>;
   // For context/consistency
   relevantChunks: Array<{
      externalId: string;
      chunk: string;
      similarity: number;
   }>;
}

/**
 * Combined search for both internal links and context
 */
export async function searchRelatedContent(
   dbClient: PgVectorDatabaseInstance,
   queryText: string,
   agentId: string,
   mode: SearchMode = "both",
   options: SearchOptions = {},
): Promise<RelatedContentResult> {
   const result: RelatedContentResult = {
      relatedPosts: [],
      relevantChunks: [],
   };

   try {
      if (mode === "links" || mode === "both") {
         const metadata = await searchContentMetadataByText(
            dbClient,
            queryText,
            agentId,
            { ...options, limit: options.limit ?? 5 },
         );
         result.relatedPosts = metadata.map((m) => ({
            externalId: m.externalId,
            slug: m.slug,
            title: m.title,
            description: m.description,
            similarity: m.similarity,
         }));
      }

      if (mode === "context" || mode === "both") {
         const chunks = await searchContentChunksByText(
            dbClient,
            queryText,
            agentId,
            { ...options, limit: options.limit ?? 10 },
         );
         result.relevantChunks = chunks.map((c) => ({
            externalId: c.externalId,
            chunk: c.chunk,
            similarity: c.similarity,
         }));
      }

      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to search related content: ${(err as Error).message}`,
      );
   }
}

/**
 * Check if content is already indexed
 */
export async function isContentIndexed(
   dbClient: PgVectorDatabaseInstance,
   externalId: string,
): Promise<boolean> {
   try {
      const result = await dbClient.query.contentMetadataRag.findFirst({
         where: eq(contentMetadataRag.externalId, externalId),
         columns: { id: true },
      });
      return !!result;
   } catch (err) {
      throw AppError.database(
         `Failed to check if content is indexed: ${(err as Error).message}`,
      );
   }
}
