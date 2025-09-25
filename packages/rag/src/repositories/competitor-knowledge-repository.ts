import {
   competitorKnowledge,
   type CompetitorKnowledgeSelect,
   type CompetitorKnowledgeInsert,
   type CompetitorKnowledgeType,
} from "../schemas/competitor-knowledge-schema";
import { eq, and, desc, sql, gt, cosineDistance } from "drizzle-orm";
import type { PgVectorDatabaseInstance } from "../client";
import { AppError, propagateError } from "@packages/utils/errors";
import { createEmbedding, createEmbeddings } from "../helpers";

export async function createCompetitorKnowledgeWithEmbedding(
   dbClient: PgVectorDatabaseInstance,
   data: Omit<
      CompetitorKnowledgeInsert,
      "embedding" | "id" | "createdAt" | "updatedAt"
   >,
) {
   try {
      const { embedding } = await createEmbedding(data.chunk);
      const result = await dbClient
         .insert(competitorKnowledge)
         .values({
            ...data,
            embedding: sql`'${JSON.stringify(embedding)}'::vector`,
         })
         .returning();
      return result[0];
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to create competitor knowledge with embedding: ${(err as Error).message}`,
      );
   }
}

export async function deleteCompetitorKnowledgeByExternalIdAndType(
   dbClient: PgVectorDatabaseInstance,
   externalId: string,
   type: CompetitorKnowledgeType,
): Promise<number> {
   try {
      const result = await dbClient
         .delete(competitorKnowledge)
         .where(
            and(
               eq(competitorKnowledge.externalId, externalId),
               eq(competitorKnowledge.type, type),
            ),
         )
         .returning({ id: competitorKnowledge.id });

      return result.length;
   } catch (err) {
      throw AppError.database(
         `Failed to delete competitor knowledge by external ID and type: ${(err as Error).message}`,
      );
   }
}

export async function deleteAllCompetitorKnowledgeByExternalIdAndType(
   dbClient: PgVectorDatabaseInstance,
   externalId: string,
   type: CompetitorKnowledgeType,
): Promise<number> {
   try {
      const result = await dbClient
         .delete(competitorKnowledge)
         .where(
            and(
               eq(competitorKnowledge.externalId, externalId),
               eq(competitorKnowledge.type, type),
            ),
         )
         .returning({ id: competitorKnowledge.id });

      return result.length;
   } catch (err) {
      throw AppError.database(
         `Failed to delete all competitor knowledge by external ID and type: ${(err as Error).message}`,
      );
   }
}

interface SearchOptions {
   limit?: number;
   similarityThreshold?: number;
   type?: CompetitorKnowledgeType;
}

async function searchCompetitorKnowledgeByCosineSimilarityAndExternalId(
   dbClient: PgVectorDatabaseInstance,
   queryEmbedding: number[],
   externalId: string,
   options: SearchOptions = {},
): Promise<CompetitorKnowledgeSelect[]> {
   try {
      const { limit = 10, similarityThreshold = 0.7, type } = options;

      const similarity = sql<number>`1 - (${cosineDistance(competitorKnowledge.embedding, queryEmbedding)})`;

      let whereConditions = and(
         eq(competitorKnowledge.externalId, externalId),
         gt(similarity, similarityThreshold),
      );

      if (type) {
         whereConditions = and(
            eq(competitorKnowledge.externalId, externalId),
            eq(competitorKnowledge.type, type),
            gt(similarity, similarityThreshold),
         );
      }

      const result = await dbClient
         .select()
         .from(competitorKnowledge)
         .where(whereConditions)
         .orderBy(() => desc(similarity))
         .limit(limit);

      return result;
   } catch (err) {
      throw AppError.database(
         `Failed to search competitor knowledge by cosine similarity and external ID: ${(err as Error).message}`,
      );
   }
}

export async function searchCompetitorKnowledgeByTextAndExternalId(
   dbClient: PgVectorDatabaseInstance,
   queryText: string,
   externalId: string,
   options: SearchOptions = {},
): Promise<CompetitorKnowledgeSelect[]> {
   try {
      const { embedding } = await createEmbedding(queryText);
      return await searchCompetitorKnowledgeByCosineSimilarityAndExternalId(
         dbClient,
         embedding,
         externalId,
         options,
      );
   } catch (err) {
      throw AppError.database(
         `Failed to search competitor knowledge by text and external ID: ${(err as Error).message}`,
      );
   }
}

export async function createCompetitorKnowledgeWithEmbeddingsBulk(
   dbClient: PgVectorDatabaseInstance,
   dataArray: Array<
      Omit<
         CompetitorKnowledgeInsert,
         "embedding" | "id" | "createdAt" | "updatedAt"
      >
   >,
): Promise<CompetitorKnowledgeSelect[]> {
   try {
      if (dataArray.length === 0) {
         return [];
      }

      const texts = dataArray.map((data) => data.chunk);
      const embeddings = await createEmbeddings(texts);

      // Filter out items with null embeddings and log warnings
      const validInsertData: Array<CompetitorKnowledgeInsert> = [];
      let skippedCount = 0;

      for (let i = 0; i < dataArray.length; i++) {
         const data = dataArray[i];
         const embedding = embeddings[i];

         if (!embedding) {
            console.warn(`Skipping competitor knowledge entry due to failed embedding: ${data.chunk.substring(0, 100)}...`);
            skippedCount++;
            continue;
         }

         validInsertData.push({
            ...data,
            embedding: embedding,
         });
      }

      if (skippedCount > 0) {
         console.warn(`Skipped ${skippedCount} entries due to embedding failures`);
      }

      if (validInsertData.length === 0) {
         console.warn("No valid embeddings created, returning empty result");
         return [];
      }

      const result = await dbClient
         .insert(competitorKnowledge)
         .values(validInsertData)
         .returning();

      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to create competitor knowledge with embeddings in bulk: ${(err as Error).message}`,
      );
   }
}
