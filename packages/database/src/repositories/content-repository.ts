import { content } from "../schemas/content";
import { inArray } from "drizzle-orm";

import type {
   ContentSelect as Content,
   ContentInsert,
} from "../schemas/content";
import type { DatabaseInstance } from "../client";
import { DatabaseError, NotFoundError } from "@packages/errors";
import { eq } from "drizzle-orm";

// Get content by slug
export async function getContentBySlug(
   dbClient: DatabaseInstance,
   slug: string,
   agentId: string,
): Promise<Content> {
   try {
      // Find by meta.slug and agentId
      const result = await dbClient.query.content.findFirst({
         where: (fields, { sql, and }) =>
            and(
               sql`${fields.meta}->>'slug' = ${slug}`,
               sql`${fields.agentId} = ${agentId}`,
            ),
      });
      if (!result) throw new NotFoundError("Content not found");
      return result;
   } catch (err) {
      if (err instanceof NotFoundError) throw err;
      throw new DatabaseError(
         `Failed to get content by slug and agentId: ${(err as Error).message}`,
      );
   }
}

export async function createContent(
   dbClient: DatabaseInstance,
   data: ContentInsert,
): Promise<Content> {
   try {
      const result = await dbClient.insert(content).values(data).returning();
      const created = result?.[0];
      if (!created) throw new NotFoundError("Content not created");
      return created;
   } catch (err) {
      if (err instanceof NotFoundError) throw err;
      throw new DatabaseError(
         `Failed to create content: ${(err as Error).message}`,
      );
   }
}

export async function getContentById(
   dbClient: DatabaseInstance,
   id: string,
): Promise<Content> {
   try {
      const result = await dbClient.query.content.findFirst({
         where: eq(content.id, id),
      });
      if (!result) throw new NotFoundError("Content not found");
      return result;
   } catch (err) {
      if (err instanceof NotFoundError) throw err;
      throw new DatabaseError(
         `Failed to get content: ${(err as Error).message}`,
      );
   }
}

export async function updateContent(
   dbClient: DatabaseInstance,
   id: string,
   data: Partial<ContentInsert>,
): Promise<Content> {
   try {
      const result = await dbClient
         .update(content)
         .set(data)
         .where(eq(content.id, id))
         .returning();
      const updated = result?.[0];
      if (!updated) throw new NotFoundError("Content not found");
      return updated;
   } catch (err) {
      if (err instanceof NotFoundError) throw err;
      throw new DatabaseError(
         `Failed to update content: ${(err as Error).message}`,
      );
   }
}

export async function deleteContent(
   dbClient: DatabaseInstance,
   id: string,
): Promise<void> {
   try {
      const result = await dbClient
         .delete(content)
         .where(eq(content.id, id))
         .returning();
      const deleted = result?.[0];
      if (!deleted) throw new NotFoundError("Content not found");
   } catch (err) {
      if (err instanceof NotFoundError) throw err;
      throw new DatabaseError(
         `Failed to delete content: ${(err as Error).message}`,
      );
   }
}

export async function listContents(
   dbClient: DatabaseInstance,
   agentIds: string[],
   status: Array<Exclude<Content["status"], null>>,
) {
   try {
      return await dbClient.query.content.findMany({
         where: (_fields, operators) =>
            operators.and(
               inArray(content.agentId, agentIds),
               inArray(content.status, status),
            ),
         columns: {
            id: true,
            meta: true,
            imageUrl: true,
            status: true,
            createdAt: true,
            stats: true,
         },
         with: {
            agent: true,
         },
         orderBy: (content, { desc }) => [desc(content.updatedAt)],
      });
   } catch (err) {
      throw new DatabaseError(
         `Failed to list contents: ${(err as Error).message}`,
      );
   }
}

export async function getContentStatsLast30Days(
   dbClient: DatabaseInstance,
   agentIds: string[],
   status: Array<Exclude<Content["status"], null>> = [
      "approved",
      "draft",
      "planning",
      "researching",
      "writing",
      "editing",
      "analyzing",
   ],
): Promise<{ count: number; wordsCount: number }> {
   try {
      const now = new Date();
      const date30dAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const items = await dbClient.query.content.findMany({
         where: (_fields, operators) =>
            operators.and(
               inArray(content.agentId, agentIds),
               inArray(content.status, status),
               operators.gte(content.createdAt, date30dAgo),
            ),
         columns: {
            stats: true,
         },
      });
      const wordsCount = items.reduce((acc, item) => {
         const wc = item.stats?.wordsCount
            ? parseInt(item.stats.wordsCount, 10)
            : 0;
         return acc + wc;
      }, 0);
      return { count: items.length, wordsCount };
   } catch (err) {
      throw new DatabaseError(
         `Failed to get content stats: ${(err as Error).message}`,
      );
   }
}

export async function getAgentContentStats(
   dbClient: DatabaseInstance,
   agentId: string,
): Promise<Content[]> {
   try {
      return await dbClient.query.content.findMany({
         where: eq(content.agentId, agentId),
         orderBy: (content, { desc }) => [desc(content.updatedAt)],
      });
   } catch (err) {
      throw new DatabaseError(
         `Failed to get agent content stats: ${(err as Error).message}`,
      );
   }
}

export async function getMostUsedKeywordsByAgent(
   dbClient: DatabaseInstance,
   agentId: string,
   limit: number = 10,
): Promise<string[]> {
   try {
      // Get all content for the agent
      const items = await dbClient.query.content.findMany({
         where: eq(content.agentId, agentId),
         columns: { meta: true },
      });

      // Aggregate keywords
      const keywordCounts: Record<string, number> = {};
      for (const item of items) {
         const keywords = item.meta?.keywords ?? [];
         for (const kw of keywords) {
            keywordCounts[kw] = (keywordCounts[kw] || 0) + 1;
         }
      }

      // Sort and return top N
      return Object.entries(keywordCounts)
         .sort((a, b) => b[1] - a[1])
         .slice(0, limit)
         .map(([kw]) => kw);
   } catch (err) {
      throw new DatabaseError(
         `Failed to get most used keywords: ${(err as Error).message}`,
      );
   }
}
