import {
   ideasRag,
   type IdeasRag,
   type IdeasRagInsert,
   type IdeaLayoutType,
} from "../schemas/ideas-rag-schema";
import { eq, and, desc, sql, cosineDistance, gt } from "drizzle-orm";
import type { PgVectorDatabaseInstance } from "../client";
import { DatabaseError, NotFoundError } from "@packages/errors";
import { createEmbedding } from "../helpers";

async function createIdeasRag(
   dbClient: PgVectorDatabaseInstance,
   data: IdeasRagInsert,
) {
   try {
      const result = await dbClient.insert(ideasRag).values(data).returning();
      return result[0];
   } catch (err) {
      throw new DatabaseError(
         `Failed to create ideas RAG entry: ${(err as Error).message}`,
      );
   }
}

export async function createIdeasRagWithEmbedding(
   dbClient: PgVectorDatabaseInstance,
   data: Omit<IdeasRagInsert, "embedding" | "id" | "createdAt" | "updatedAt">,
) {
   try {
      // Create embedding from title and description combined
      const combinedText = `${data.title} ${data.description}`;
      const { embedding } = await createEmbedding(combinedText);
      return await createIdeasRag(dbClient, {
         ...data,
         embedding,
      });
   } catch (err) {
      if (err instanceof NotFoundError) throw err;
      throw new DatabaseError(
         `Failed to create ideas RAG entry with embedding: ${(err as Error).message}`,
      );
   }
}

export async function deleteIdeasRagByIdeaId(
   dbClient: PgVectorDatabaseInstance,
   ideaId: string,
): Promise<number> {
   try {
      const result = await dbClient
         .delete(ideasRag)
         .where(eq(ideasRag.ideaId, ideaId))
         .returning({ id: ideasRag.id });

      return result.length;
   } catch (err) {
      throw new DatabaseError(
         `Failed to delete ideas RAG entries by idea ID: ${(err as Error).message}`,
      );
   }
}

export async function deleteIdeasRagByAgentId(
   dbClient: PgVectorDatabaseInstance,
   agentId: string,
): Promise<number> {
   try {
      const result = await dbClient
         .delete(ideasRag)
         .where(eq(ideasRag.agentId, agentId))
         .returning({ id: ideasRag.id });

      return result.length;
   } catch (err) {
      throw new DatabaseError(
         `Failed to delete ideas RAG entries by agent ID: ${(err as Error).message}`,
      );
   }
}

interface SearchOptions {
   limit?: number;
   similarityThreshold?: number;
   layout?: IdeaLayoutType;
}

async function searchIdeasRagByCosineSimilarityAndAgentId(
   dbClient: PgVectorDatabaseInstance,
   queryEmbedding: number[],
   agentId: string,
   options: SearchOptions = {},
): Promise<IdeasRag[]> {
   try {
      const { limit = 10, similarityThreshold = 0.7, layout } = options;

      const similarity = sql<number>`1 - (${cosineDistance(ideasRag.embedding, queryEmbedding)})`;

      let whereConditions = and(
         eq(ideasRag.agentId, agentId),
         gt(similarity, similarityThreshold),
      );

      if (layout) {
         whereConditions = and(whereConditions, eq(ideasRag.layout, layout));
      }

      const result = await dbClient
         .select()
         .from(ideasRag)
         .where(whereConditions)
         .orderBy(() => desc(similarity))
         .limit(limit);

      return result;
   } catch (err) {
      throw new DatabaseError(
         `Failed to search ideas RAG by cosine similarity and agent ID: ${(err as Error).message}`,
      );
   }
}

export async function searchIdeasRagByTextAndAgentId(
   dbClient: PgVectorDatabaseInstance,
   queryText: string,
   agentId: string,
   options: SearchOptions = {},
): Promise<IdeasRag[]> {
   try {
      const { embedding } = await createEmbedding(queryText);
      return await searchIdeasRagByCosineSimilarityAndAgentId(
         dbClient,
         embedding,
         agentId,
         options,
      );
   } catch (err) {
      throw new DatabaseError(
         `Failed to search ideas RAG by text and agent ID: ${(err as Error).message}`,
      );
   }
}

export async function checkForDuplicateIdeas(
   dbClient: PgVectorDatabaseInstance,
   title: string,
   description: string,
   agentId: string,
   similarityThreshold: number = 0.8,
): Promise<boolean> {
   try {
      // Combine title and description for better duplicate detection
      const combinedText = `${title} ${description}`;

      // Search for similar ideas using semantic similarity
      const similarIdeas = await searchIdeasRagByTextAndAgentId(
         dbClient,
         combinedText,
         agentId,
         { similarityThreshold, limit: 1 },
      );

      return similarIdeas.length > 0;
   } catch (err) {
      throw new DatabaseError(
         `Failed to check for duplicate ideas: ${(err as Error).message}`,
      );
   }
}
