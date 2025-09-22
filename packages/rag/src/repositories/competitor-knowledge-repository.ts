import {
   competitorKnowledge,
   type CompetitorKnowledgeSelect,
   type CompetitorKnowledgeInsert,
   type CompetitorKnowledgeType,
} from "../schemas/competitor-knowledge-schema";
import { eq, and, desc, sql } from "drizzle-orm";
import type { PgVectorDatabaseInstance } from "../client";
import { DatabaseError, NotFoundError } from "@packages/errors";
import { createEmbedding, cosineSimilarity } from "../helpers";

async function createCompetitorKnowledge(
   dbClient: PgVectorDatabaseInstance,
   data: CompetitorKnowledgeInsert,
) {
   try {
      const result = await dbClient
         .insert(competitorKnowledge)
         .values(data)
         .returning();
      return result[0];
   } catch (err) {
      throw new DatabaseError(
         `Failed to create competitor knowledge: ${(err as Error).message}`,
      );
   }
}

export async function createCompetitorKnowledgeWithEmbedding(
   dbClient: PgVectorDatabaseInstance,
   data: Omit<
      CompetitorKnowledgeInsert,
      "embedding" | "id" | "createdAt" | "updatedAt"
   >,
) {
   try {
      const { embedding } = await createEmbedding(data.chunk);
      return await createCompetitorKnowledge(dbClient, {
         ...data,
         embedding,
      });
   } catch (err) {
      if (err instanceof NotFoundError) throw err;
      throw new DatabaseError(
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
      throw new DatabaseError(
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
      throw new DatabaseError(
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

      let whereConditions = and(
         eq(competitorKnowledge.externalId, externalId),
         sql`${cosineSimilarity(competitorKnowledge.embedding, queryEmbedding)} >= ${similarityThreshold}`,
      );

      if (type) {
         whereConditions = and(
            eq(competitorKnowledge.externalId, externalId),
            eq(competitorKnowledge.type, type),
            sql`${cosineSimilarity(competitorKnowledge.embedding, queryEmbedding)} >= ${similarityThreshold}`,
         );
      }

      const result = await dbClient
         .select()
         .from(competitorKnowledge)
         .where(whereConditions)
         .orderBy(
            desc(
               cosineSimilarity(competitorKnowledge.embedding, queryEmbedding),
            ),
         )
         .limit(limit);

      return result;
   } catch (err) {
      throw new DatabaseError(
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
      throw new DatabaseError(
         `Failed to search competitor knowledge by text and external ID: ${(err as Error).message}`,
      );
   }
}

