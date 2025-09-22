import {
   brandKnowledge,
   type BrandKnowledge,
   type BrandKnowledgeInsert,
   type BrandKnowledgeType,
} from "../schemas/brand-knowledge-schema";
import { eq, and, desc, sql } from "drizzle-orm";
import type { PgVectorDatabaseInstance } from "../client";
import { DatabaseError, NotFoundError } from "@packages/errors";
import { createEmbedding, cosineSimilarity } from "../helpers";

async function createBrandKnowledge(
   dbClient: PgVectorDatabaseInstance,
   data: BrandKnowledgeInsert,
) {
   try {
      const result = await dbClient
         .insert(brandKnowledge)
         .values(data)
         .returning();
      return result[0];
   } catch (err) {
      throw new DatabaseError(
         `Failed to create brand knowledge: ${(err as Error).message}`,
      );
   }
}

export async function createBrandKnowledgeWithEmbedding(
   dbClient: PgVectorDatabaseInstance,
   data: Omit<
      BrandKnowledgeInsert,
      "embedding" | "id" | "createdAt" | "updatedAt"
   >,
) {
   try {
      const { embedding } = await createEmbedding(data.chunk);
      return await createBrandKnowledge(dbClient, {
         ...data,
         embedding,
      });
   } catch (err) {
      if (err instanceof NotFoundError) throw err;
      throw new DatabaseError(
         `Failed to create brand knowledge with embedding: ${(err as Error).message}`,
      );
   }
}

export async function deleteBrandKnowledgeByExternalIdAndType(
   dbClient: PgVectorDatabaseInstance,
   externalId: string,
   type: BrandKnowledgeType,
): Promise<number> {
   try {
      const result = await dbClient
         .delete(brandKnowledge)
         .where(
            and(
               eq(brandKnowledge.externalId, externalId),
               eq(brandKnowledge.type, type),
            ),
         )
         .returning({ id: brandKnowledge.id });

      return result.length;
   } catch (err) {
      throw new DatabaseError(
         `Failed to delete brand knowledge by external ID and type: ${(err as Error).message}`,
      );
   }
}

export async function deleteAllBrandKnowledgeByExternalIdAndType(
   dbClient: PgVectorDatabaseInstance,
   externalId: string,
   type: BrandKnowledgeType,
): Promise<number> {
   try {
      const result = await dbClient
         .delete(brandKnowledge)
         .where(
            and(
               eq(brandKnowledge.externalId, externalId),
               eq(brandKnowledge.type, type),
            ),
         )
         .returning({ id: brandKnowledge.id });

      return result.length;
   } catch (err) {
      throw new DatabaseError(
         `Failed to delete all brand knowledge by external ID and type: ${(err as Error).message}`,
      );
   }
}

interface SearchOptions {
   limit?: number;
   similarityThreshold?: number;
   type?: BrandKnowledgeType;
}

async function searchBrandKnowledgeByCosineSimilarityAndExternalId(
   dbClient: PgVectorDatabaseInstance,
   queryEmbedding: number[],
   externalId: string,
   options: SearchOptions = {},
): Promise<BrandKnowledge[]> {
   try {
      const { limit = 10, similarityThreshold = 0.7, type } = options;

      let whereConditions = and(
         eq(brandKnowledge.externalId, externalId),
         sql`${cosineSimilarity(brandKnowledge.embedding, queryEmbedding)} >= ${similarityThreshold}`,
      );

      if (type) {
         whereConditions = and(
            eq(brandKnowledge.externalId, externalId),
            eq(brandKnowledge.type, type),
            sql`${cosineSimilarity(brandKnowledge.embedding, queryEmbedding)} >= ${similarityThreshold}`,
         );
      }

      const result = await dbClient
         .select()
         .from(brandKnowledge)
         .where(whereConditions)
         .orderBy(
            desc(cosineSimilarity(brandKnowledge.embedding, queryEmbedding)),
         )
         .limit(limit);

      return result;
   } catch (err) {
      throw new DatabaseError(
         `Failed to search brand knowledge by cosine similarity and external ID: ${(err as Error).message}`,
      );
   }
}

export async function searchBrandKnowledgeByTextAndExternalId(
   dbClient: PgVectorDatabaseInstance,
   queryText: string,
   externalId: string,
   options: SearchOptions = {},
): Promise<BrandKnowledge[]> {
   try {
      const { embedding } = await createEmbedding(queryText);
      return await searchBrandKnowledgeByCosineSimilarityAndExternalId(
         dbClient,
         embedding,
         externalId,
         options,
      );
   } catch (err) {
      throw new DatabaseError(
         `Failed to search brand knowledge by text and external ID: ${(err as Error).message}`,
      );
   }
}
