import { AppError, propagateError } from "@packages/utils/errors";
import { and, count, desc, eq, inArray, isNotNull, ne, sql } from "drizzle-orm";
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
   organizationId: string,
   writerId?: string,
) {
   try {
      const result = await dbClient.query.content.findFirst({
         where: (content, { eq, and, isNull }) => {
            const slugCondition = sql`${content.meta}->>'slug' = ${slug}`;
            const orgCondition = eq(content.organizationId, organizationId);

            if (writerId) {
               return and(
                  orgCondition,
                  eq(content.writerId, writerId),
                  slugCondition,
               );
            }
            // For manual content (no agent)
            return and(orgCondition, isNull(content.writerId), slugCondition);
         },
      });
      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to get content by slug: ${(err as Error).message}`,
      );
   }
}

export async function getContentsByWriterId(
   dbClient: DatabaseInstance,
   writerId: string,
   status?: string,
) {
   try {
      const result = await dbClient.query.content.findMany({
         where: (content, { eq, and }) => {
            if (status) {
               return and(
                  eq(content.writerId, writerId),
                  sql`${content.status} = ${status}`,
               );
            }
            return eq(content.writerId, writerId);
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
export async function getContentCountsByWriterIds(
   dbClient: DatabaseInstance,
   writerIds: string[],
): Promise<Map<string, number>> {
   if (writerIds.length === 0) {
      return new Map();
   }

   try {
      const result = await dbClient
         .select({
            writerId: content.writerId,
            count: count(),
         })
         .from(content)
         .where(inArray(content.writerId, writerIds))
         .groupBy(content.writerId);

      const countMap = new Map<string, number>();
      for (const row of result) {
         if (row.writerId) {
            countMap.set(row.writerId, Number(row.count));
         }
      }

      // Fill in zeros for agents with no content
      for (const writerId of writerIds) {
         if (!countMap.has(writerId)) {
            countMap.set(writerId, 0);
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
         .set({ status: "published", shareStatus: "shared" })
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

export async function markContentAsDraft(
   dbClient: DatabaseInstance,
   contentId: string,
) {
   try {
      const result = await dbClient
         .update(content)
         .set({ status: "draft" })
         .where(eq(content.id, contentId))
         .returning();

      if (!result.length) {
         throw AppError.database("Content not found");
      }
      return result[0];
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to mark content as draft: ${(err as Error).message}`,
      );
   }
}

export async function toggleContentShare(
   dbClient: DatabaseInstance,
   contentId: string,
   shared: boolean,
) {
   try {
      const result = await dbClient
         .update(content)
         .set({ shareStatus: shared ? "shared" : "private" })
         .where(eq(content.id, contentId))
         .returning();

      if (!result.length) {
         throw AppError.database("Content not found");
      }
      return result[0];
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to toggle content share: ${(err as Error).message}`,
      );
   }
}

export async function getSharedContentById(
   dbClient: DatabaseInstance,
   contentId: string,
) {
   try {
      const result = await dbClient.query.content.findFirst({
         where: (content, { eq, and }) =>
            and(eq(content.id, contentId), eq(content.shareStatus, "shared")),
         with: {
            writer: true,
         },
      });
      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to get shared content: ${(err as Error).message}`,
      );
   }
}

export async function listContents(
   dbClient: DatabaseInstance,
   writerIds: string[],
   statuses?: string[],
) {
   try {
      const conditions = [inArray(content.writerId, writerIds)];

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

/**
 * List contents by team (team-scoped query for UI)
 */
export async function listContentsByTeam(
   dbClient: DatabaseInstance,
   teamId: string,
   options?: {
      statuses?: ContentStatus[];
      writerId?: string | null; // null = manual content only, undefined = all
      limit?: number;
      offset?: number;
   },
) {
   try {
      const conditions = [eq(content.teamId, teamId)];

      if (options?.statuses && options.statuses.length > 0) {
         conditions.push(inArray(content.status, options.statuses));
      }

      if (options?.writerId === null) {
         // Manual content only (no agent)
         conditions.push(sql`${content.writerId} IS NULL`);
      } else if (options?.writerId) {
         // Specific agent
         conditions.push(eq(content.writerId, options.writerId));
      }
      // If writerId is undefined, get all content (both manual and agent-based)

      const query = dbClient
         .select()
         .from(content)
         .where(and(...conditions))
         .orderBy(desc(content.createdAt));

      if (options?.limit) {
         query.limit(options.limit);
      }
      if (options?.offset) {
         query.offset(options.offset);
      }

      const result = await query;
      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to list contents by team: ${(err as Error).message}`,
      );
   }
}

/**
 * List contents by organization (for admin/billing queries - not team-scoped)
 */
export async function listContentsByOrganization(
   dbClient: DatabaseInstance,
   organizationId: string,
   options?: {
      statuses?: ContentStatus[];
      writerId?: string | null; // null = manual content only, undefined = all
      limit?: number;
      offset?: number;
   },
) {
   try {
      const conditions = [eq(content.organizationId, organizationId)];

      if (options?.statuses && options.statuses.length > 0) {
         conditions.push(inArray(content.status, options.statuses));
      }

      if (options?.writerId === null) {
         // Manual content only (no agent)
         conditions.push(sql`${content.writerId} IS NULL`);
      } else if (options?.writerId) {
         // Specific agent
         conditions.push(eq(content.writerId, options.writerId));
      }
      // If writerId is undefined, get all content (both manual and agent-based)

      const query = dbClient
         .select()
         .from(content)
         .where(and(...conditions))
         .orderBy(desc(content.createdAt));

      if (options?.limit) {
         query.limit(options.limit);
      }
      if (options?.offset) {
         query.offset(options.offset);
      }

      const result = await query;
      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to list contents by organization: ${(err as Error).message}`,
      );
   }
}

/**
 * Count contents by team (team-scoped query for UI)
 */
export async function countContentsByTeam(
   dbClient: DatabaseInstance,
   teamId: string,
   statuses?: ContentStatus[],
) {
   try {
      const conditions = [eq(content.teamId, teamId)];

      if (statuses && statuses.length > 0) {
         conditions.push(inArray(content.status, statuses));
      }

      const result = await dbClient
         .select({ count: count() })
         .from(content)
         .where(and(...conditions));

      return result[0]?.count ?? 0;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to count contents by team: ${(err as Error).message}`,
      );
   }
}

/**
 * Count contents by organization (for admin/billing queries - not team-scoped)
 */
export async function countContentsByOrganization(
   dbClient: DatabaseInstance,
   organizationId: string,
   statuses?: ContentStatus[],
) {
   try {
      const conditions = [eq(content.organizationId, organizationId)];

      if (statuses && statuses.length > 0) {
         conditions.push(inArray(content.status, statuses));
      }

      const result = await dbClient
         .select({ count: count() })
         .from(content)
         .where(and(...conditions));

      return result[0]?.count ?? 0;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to count contents: ${(err as Error).message}`,
      );
   }
}

/**
 * List all cluster pillars (content with non-empty clusterConfig) for a team.
 */
export async function listClustersByTeam(
   db: DatabaseInstance,
   teamId: string,
   opts: { limit?: number; page?: number } = {},
) {
   const { limit = 20, page = 1 } = opts;
   const offset = (page - 1) * limit;

   try {
      const rows = await db
         .select()
         .from(content)
         .where(
            and(
               eq(content.teamId, teamId),
               isNotNull(content.clusterConfig),
               ne(sql`(${content.clusterConfig})::text`, "{}"),
            ),
         )
         .orderBy(desc(content.createdAt))
         .limit(limit)
         .offset(offset);
      return rows;
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to list clusters");
   }
}
