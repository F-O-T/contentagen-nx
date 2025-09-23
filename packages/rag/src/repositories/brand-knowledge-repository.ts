import {
   brandKnowledge,
   type BrandKnowledge,
   type BrandKnowledgeInsert,
   type BrandKnowledgeType,
} from "../schemas/brand-knowledge-schema";
import { eq, and, desc, sql, gt, cosineDistance } from "drizzle-orm";
import type { PgVectorDatabaseInstance } from "../client";
import { AppError, propagateError } from "@packages/utils/errors";
import { createEmbedding } from "../helpers";

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
      throw AppError.database(
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
      propagateError(err);
      throw AppError.database(
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
      throw AppError.database(
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
      throw AppError.database(
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

      const similarity = sql<number>`1 - (${cosineDistance(brandKnowledge.embedding, queryEmbedding)})`;

      let whereConditions = and(
         eq(brandKnowledge.externalId, externalId),
         gt(similarity, similarityThreshold),
      );

      if (type) {
         whereConditions = and(
            eq(brandKnowledge.externalId, externalId),
            eq(brandKnowledge.type, type),
            gt(similarity, similarityThreshold),
         );
      }

      const result = await dbClient
         .select()
         .from(brandKnowledge)
         .where(whereConditions)
         .orderBy(() => desc(similarity))
         .limit(limit);

      return result;
   } catch (err) {
      throw AppError.database(
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
      throw AppError.database(
         `Failed to search brand knowledge by text and external ID: ${(err as Error).message}`,
      );
   }
}
