import { AppError, propagateError } from "@packages/utils/errors";
import { and, count, desc, eq, inArray, sql } from "drizzle-orm";
import type { DatabaseInstance } from "../client";
import {
   type ContentInsert,
   type ContentStatus,
   content,
} from "../schemas/content";

export async function createContent(
   dbClient: DatabaseInstance,
   data: ContentInsert,
) {
   try {
      const result = await dbClient.insert(content).values(data).returning();
      return result[0];
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to create content: ${(err as Error).message}`,
      );
   }
}

export async function getContentById(
   dbClient: DatabaseInstance,
   contentId: string,
) {
   try {
      const result = await dbClient.query.content.findFirst({
         where: (content, { eq }) => eq(content.id, contentId),
      });
      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to get content: ${(err as Error).message}`,
      );
   }
}

export async function getContentBySlug(
   dbClient: DatabaseInstance,
   slug: string,
   agentId: string,
) {
   try {
      const result = await dbClient.query.content.findFirst({
         where: (content, { eq, and }) =>
            and(
               eq(content.agentId, agentId),
               sql`${content.meta}->>'slug' = ${slug}`,
            ),
      });
      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to get content by slug: ${(err as Error).message}`,
      );
   }
}

export async function getContentsByAgentId(
   dbClient: DatabaseInstance,
   agentId: string,
   status?: string,
) {
   try {
      const result = await dbClient.query.content.findMany({
         where: (content, { eq, and }) => {
            if (status) {
               return and(
                  eq(content.agentId, agentId),
                  sql`${content.status} = ${status}`,
               );
            }
            return eq(content.agentId, agentId);
         },
         orderBy: (content, { desc }) => desc(content.createdAt),
      });
      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to get contents: ${(err as Error).message}`,
      );
   }
}

/**
 * Batch query to get content counts by multiple agent IDs
 * This avoids N+1 queries when listing agents with content counts
 */
export async function getContentCountsByAgentIds(
   dbClient: DatabaseInstance,
   agentIds: string[],
): Promise<Map<string, number>> {
   if (agentIds.length === 0) {
      return new Map();
   }

   try {
      const result = await dbClient
         .select({
            agentId: content.agentId,
            count: count(),
         })
         .from(content)
         .where(inArray(content.agentId, agentIds))
         .groupBy(content.agentId);

      const countMap = new Map<string, number>();
      for (const row of result) {
         countMap.set(row.agentId, Number(row.count));
      }

      // Fill in zeros for agents with no content
      for (const agentId of agentIds) {
         if (!countMap.has(agentId)) {
            countMap.set(agentId, 0);
         }
      }

      return countMap;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to get content counts: ${(err as Error).message}`,
      );
   }
}

export async function updateContent(
   dbClient: DatabaseInstance,
   contentId: string,
   data: Partial<ContentInsert>,
) {
   try {
      const result = await dbClient
         .update(content)
         .set(data)
         .where(eq(content.id, contentId))
         .returning();

      if (!result.length) {
         throw AppError.database("Content not found");
      }
      return result[0];
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to update content: ${(err as Error).message}`,
      );
   }
}

export async function updateContentCurrentVersion(
   dbClient: DatabaseInstance,
   contentId: string,
   version: number,
) {
   try {
      const result = await dbClient
         .update(content)
         .set({ currentVersion: version })
         .where(eq(content.id, contentId))
         .returning();

      if (!result.length) {
         throw AppError.database("Content not found");
      }
      return result[0];
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to update content version: ${(err as Error).message}`,
      );
   }
}

export async function deleteContent(
   dbClient: DatabaseInstance,
   contentId: string,
) {
   try {
      const result = await dbClient
         .delete(content)
         .where(eq(content.id, contentId))
         .returning();

      if (!result.length) {
         throw AppError.database("Content not found");
      }
      return result[0];
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to delete content: ${(err as Error).message}`,
      );
   }
}

export async function deleteBulkContent(
   dbClient: DatabaseInstance,
   contentIds: string[],
) {
   try {
      const result = await dbClient
         .delete(content)
         .where(inArray(content.id, contentIds))
         .returning();

      return { count: result.length };
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to delete bulk content: ${(err as Error).message}`,
      );
   }
}

export async function publishContent(
   dbClient: DatabaseInstance,
   contentId: string,
) {
   try {
      const result = await dbClient
         .update(content)
         .set({ status: "published" })
         .where(eq(content.id, contentId))
         .returning();

      if (!result.length) {
         throw AppError.database("Content not found");
      }
      return result[0];
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to publish content: ${(err as Error).message}`,
      );
   }
}

export async function archiveContent(
   dbClient: DatabaseInstance,
   contentId: string,
) {
   try {
      const result = await dbClient
         .update(content)
         .set({ status: "archived" })
         .where(eq(content.id, contentId))
         .returning();

      if (!result.length) {
         throw AppError.database("Content not found");
      }
      return result[0];
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to archive content: ${(err as Error).message}`,
      );
   }
}

export async function updateAIAssistantStats(
   dbClient: DatabaseInstance,
   contentId: string,
   statsUpdate: { completions?: number; edits?: number; suggestions?: number },
) {
   try {
      // Use atomic SQL update to avoid race condition
      // This uses PostgreSQL JSONB operators to increment values atomically
      const result = await dbClient
         .update(content)
         .set({
            aiAssistantStats: sql`
					jsonb_set(
						jsonb_set(
							jsonb_set(
								jsonb_set(
									COALESCE(${content.aiAssistantStats}, '{"completions": 0, "edits": 0, "suggestions": 0}'::jsonb),
									'{completions}',
									to_jsonb(COALESCE((${content.aiAssistantStats}->>'completions')::int, 0) + ${statsUpdate.completions || 0})
								),
								'{edits}',
								to_jsonb(COALESCE((${content.aiAssistantStats}->>'edits')::int, 0) + ${statsUpdate.edits || 0})
							),
							'{suggestions}',
							to_jsonb(COALESCE((${content.aiAssistantStats}->>'suggestions')::int, 0) + ${statsUpdate.suggestions || 0})
						),
						'{lastUsedAt}',
						to_jsonb(${new Date().toISOString()})
					)
				`,
         })
         .where(eq(content.id, contentId))
         .returning();

      if (!result.length) {
         throw AppError.database("Content not found");
      }

      return result[0];
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to update AI assistant stats: ${(err as Error).message}`,
      );
   }
}

export async function listContents(
   dbClient: DatabaseInstance,
   agentIds: string[],
   statuses?: string[],
) {
   try {
      const conditions = [inArray(content.agentId, agentIds)];

      if (statuses && statuses.length > 0) {
         conditions.push(inArray(content.status, statuses as ContentStatus[]));
      }

      const result = await dbClient
         .select()
         .from(content)
         .where(and(...conditions))
         .orderBy(desc(content.createdAt));

      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to list contents: ${(err as Error).message}`,
      );
   }
}
