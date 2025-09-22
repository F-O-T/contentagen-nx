import {
   relatedSlugs,
   type RelatedSlugs,
   type RelatedSlugsInsert,
} from "../schemas/related-slugs-schema";
import { eq, desc, sql } from "drizzle-orm";
import type { PgVectorDatabaseInstance } from "../client";
import { DatabaseError, NotFoundError } from "@packages/errors";
import { createEmbedding, cosineSimilarity } from "../helpers";

async function createRelatedSlugs(
   dbClient: PgVectorDatabaseInstance,
   data: RelatedSlugsInsert,
) {
   try {
      const result = await dbClient
         .insert(relatedSlugs)
         .values(data)
         .returning();
      return result[0];
   } catch (err) {
      throw new DatabaseError(
         `Failed to create related slugs: ${(err as Error).message}`,
      );
   }
}

export async function createRelatedSlugsWithEmbedding(
   dbClient: PgVectorDatabaseInstance,
   data: Omit<
      RelatedSlugsInsert,
      "embedding" | "id" | "createdAt" | "updatedAt"
   >,
) {
   try {
      const { embedding } = await createEmbedding(data.slug);
      return await createRelatedSlugs(dbClient, {
         ...data,
         embedding,
      });
   } catch (err) {
      if (err instanceof NotFoundError) throw err;
      throw new DatabaseError(
         `Failed to create related slugs with embedding: ${(err as Error).message}`,
      );
   }
}

export async function deleteRelatedSlugsBySlug(
   dbClient: PgVectorDatabaseInstance,
   slug: string,
): Promise<number> {
   try {
      const result = await dbClient
         .delete(relatedSlugs)
         .where(eq(relatedSlugs.slug, slug))
         .returning({ id: relatedSlugs.id });

      return result.length;
   } catch (err) {
      throw new DatabaseError(
         `Failed to delete related slugs by slug: ${(err as Error).message}`,
      );
   }
}

export async function bulkDeleteRelatedSlugsBySlugs(
   dbClient: PgVectorDatabaseInstance,
   slugs: string[],
): Promise<number> {
   try {
      const result = await dbClient
         .delete(relatedSlugs)
         .where(sql`${relatedSlugs.slug} = ANY(${slugs})`)
         .returning({ id: relatedSlugs.id });

      return result.length;
   } catch (err) {
      throw new DatabaseError(
         `Failed to bulk delete related slugs by slugs: ${(err as Error).message}`,
      );
   }
}

export async function findRelatedSlugsBySlug(
   dbClient: PgVectorDatabaseInstance,
   slug: string,
): Promise<RelatedSlugs[]> {
   try {
      const result = await dbClient
         .select()
         .from(relatedSlugs)
         .where(eq(relatedSlugs.slug, slug));

      return result;
   } catch (err) {
      throw new DatabaseError(
         `Failed to find related slugs by slug: ${(err as Error).message}`,
      );
   }
}

interface RelatedSlugsSearchOptions {
   limit?: number;
   similarityThreshold?: number;
}

async function searchRelatedSlugsByCosineSimilarity(
   dbClient: PgVectorDatabaseInstance,
   queryEmbedding: number[],
   options: RelatedSlugsSearchOptions = {},
): Promise<RelatedSlugs[]> {
   try {
      const { limit = 10, similarityThreshold = 0.7 } = options;

      const result = await dbClient
         .select()
         .from(relatedSlugs)
         .where(
            sql`${cosineSimilarity(relatedSlugs.embedding, queryEmbedding)} >= ${similarityThreshold}`,
         )
         .orderBy(
            desc(cosineSimilarity(relatedSlugs.embedding, queryEmbedding)),
         )
         .limit(limit);

      return result;
   } catch (err) {
      throw new DatabaseError(
         `Failed to search related slugs by cosine similarity: ${(err as Error).message}`,
      );
   }
}

export async function searchRelatedSlugsByText(
   dbClient: PgVectorDatabaseInstance,
   queryText: string,
   options: RelatedSlugsSearchOptions = {},
): Promise<RelatedSlugs[]> {
   try {
      const { embedding } = await createEmbedding(queryText);
      return await searchRelatedSlugsByCosineSimilarity(
         dbClient,
         embedding,
         options,
      );
   } catch (err) {
      throw new DatabaseError(
         `Failed to search related slugs by text: ${(err as Error).message}`,
      );
   }
}
