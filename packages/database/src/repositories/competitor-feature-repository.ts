import { competitorFeature } from "../schemas/competitor-feature";
import { eq, and, sql, inArray, desc } from "drizzle-orm";
import type {
   CompetitorFeatureSelect,
   CompetitorFeatureInsert,
} from "../schemas/competitor-feature";
import type { DatabaseInstance } from "../client";
import { AppError, propagateError } from "@packages/utils/errors";

const buildOwnerExists = (userId?: string, organizationId?: string) => {
   if (!userId && !organizationId) return sql`TRUE`;

   return sql`
    EXISTS (
      SELECT 1 FROM competitor c
      WHERE c.id = ${competitorFeature.competitorId}
      AND (
        ${userId ? sql`c.user_id = ${userId}` : sql``}
        ${organizationId ? (userId ? sql` OR c.organization_id = ${organizationId}` : sql`c.organization_id = ${organizationId}`) : sql``}
      )
    )
  `;
};

// Combines a cutoff date condition with the owner existence condition

export async function createCompetitorFeature(
   dbClient: DatabaseInstance,
   data: Omit<CompetitorFeatureInsert, "id" | "extractedAt">,
): Promise<CompetitorFeatureSelect> {
   try {
      const result = await dbClient
         .insert(competitorFeature)
         .values(data)
         .returning();
      const created = result?.[0];
      if (!created) throw AppError.database("Competitor feature not created");
      return created;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to create competitor feature: ${(err as Error).message}`,
      );
   }
}

export async function getCompetitorFeatureById(
   dbClient: DatabaseInstance,
   id: string,
): Promise<CompetitorFeatureSelect> {
   try {
      const result = await dbClient.query.competitorFeature.findFirst({
         where: eq(competitorFeature.id, id),
         with: {
            competitor: true,
         },
      });
      if (!result) throw AppError.database("Competitor feature not found");
      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to get competitor feature: ${(err as Error).message}`,
      );
   }
}

export async function updateCompetitorFeature(
   dbClient: DatabaseInstance,
   id: string,
   data: Partial<CompetitorFeatureInsert>,
): Promise<CompetitorFeatureSelect> {
   try {
      const result = await dbClient
         .update(competitorFeature)
         .set(data)
         .where(eq(competitorFeature.id, id))
         .returning();
      const updated = result?.[0];
      if (!updated) throw AppError.database("Competitor feature not found");
      return updated;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to update competitor feature: ${(err as Error).message}`,
      );
   }
}

export async function deleteCompetitorFeature(
   dbClient: DatabaseInstance,
   id: string,
): Promise<void> {
   try {
      const result = await dbClient
         .delete(competitorFeature)
         .where(eq(competitorFeature.id, id))
         .returning();
      const deleted = result?.[0];
      if (!deleted) throw AppError.database("Competitor feature not found");
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to delete competitor feature: ${(err as Error).message}`,
      );
   }
}

export async function getFeaturesByCompetitorId(
   dbClient: DatabaseInstance,
   competitorId: string,
   {
      page = 1,
      limit = 50,
      sortBy = "extractedAt",
      sortOrder = "desc",
   }: {
      page?: number;
      limit?: number;
      sortBy?: "extractedAt" | "featureName";
      sortOrder?: "asc" | "desc";
   } = {},
): Promise<CompetitorFeatureSelect[]> {
   try {
      const offset = (page - 1) * limit;
      const orderByField =
         sortBy === "featureName"
            ? competitorFeature.featureName
            : competitorFeature.extractedAt;
      const orderByDirection = sortOrder === "asc" ? "asc" : "desc";

      return await dbClient.query.competitorFeature.findMany({
         where: eq(competitorFeature.competitorId, competitorId),
         limit,
         offset,
         orderBy: [
            orderByDirection === "asc" ? orderByField : desc(orderByField),
         ],
         with: {
            competitor: {
               columns: {
                  id: true,
                  name: true,
                  websiteUrl: true,
               },
            },
         },
      });
   } catch (err) {
      throw AppError.database(
         `Failed to get features by competitor ID: ${(err as Error).message}`,
      );
   }
}

export async function getTotalFeaturesByCompetitorId(
   dbClient: DatabaseInstance,
   competitorId: string,
): Promise<number> {
   try {
      const result = await dbClient
         .select({ value: sql<number>`cast(count(*) as int)` })
         .from(competitorFeature)
         .where(eq(competitorFeature.competitorId, competitorId));
      return result[0]?.value ?? 0;
   } catch (err) {
      throw AppError.database(
         `Failed to get total features by competitor ID: ${(err as Error).message}`,
      );
   }
}

export async function searchFeatures(
   dbClient: DatabaseInstance,
   {
      query,
      competitorId,
      page = 1,
      limit = 20,
   }: {
      query: string;
      competitorId?: string;
      page?: number;
      limit?: number;
   },
): Promise<CompetitorFeatureSelect[]> {
   try {
      const offset = (page - 1) * limit;
      const searchPattern = `%${query.toLowerCase()}%`;

      const buildWhereCondition = () => {
         const base = sql`${competitorFeature.featureName}::text ILIKE ${searchPattern} OR ${competitorFeature.summary}::text ILIKE ${searchPattern}`;
         if (!competitorId) return base;
         return and(base, eq(competitorFeature.competitorId, competitorId));
      };

      const whereCondition = buildWhereCondition();

      return await dbClient.query.competitorFeature.findMany({
         where: whereCondition,
         limit,
         offset,
         orderBy: [desc(competitorFeature.extractedAt)],
         with: {
            competitor: {
               columns: {
                  id: true,
                  name: true,
                  websiteUrl: true,
               },
            },
         },
      });
   } catch (err) {
      throw AppError.database(
         `Failed to search competitor features: ${(err as Error).message}`,
      );
   }
}

export async function getRecentFeatures(
   dbClient: DatabaseInstance,
   {
      userId,
      organizationId,
      days = 30,
      limit = 50,
   }: {
      userId?: string;
      organizationId?: string;
      days?: number;
      limit?: number;
   },
): Promise<CompetitorFeatureSelect[]> {
   try {
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const buildDateAndOwnerWhere = (
         cutoffDate: Date,
         userId?: string,
         organizationId?: string,
      ) => {
         const dateCondition = sql`${competitorFeature.extractedAt} >= ${cutoffDate}`;
         const ownerExists = buildOwnerExists(userId, organizationId);
         return and(dateCondition, ownerExists);
      };
      const whereCondition = buildDateAndOwnerWhere(
         cutoffDate,
         userId,
         organizationId,
      );

      return await dbClient.query.competitorFeature.findMany({
         where: whereCondition,
         limit,
         orderBy: [desc(competitorFeature.extractedAt)],
         with: {
            competitor: {
               columns: {
                  id: true,
                  name: true,
                  websiteUrl: true,
               },
            },
         },
      });
   } catch (err) {
      throw AppError.database(
         `Failed to get recent competitor features: ${(err as Error).message}`,
      );
   }
}

export async function bulkCreateFeatures(
   dbClient: DatabaseInstance,
   features: Omit<CompetitorFeatureInsert, "id" | "extractedAt">[],
): Promise<CompetitorFeatureSelect[]> {
   try {
      if (!features || features.length === 0) {
         return [];
      }

      const result = await dbClient
         .insert(competitorFeature)
         .values(features)
         .returning();
      return result;
   } catch (err) {
      throw AppError.database(
         `Failed to bulk create competitor features: ${(err as Error).message}`,
      );
   }
}

export async function bulkDeleteFeatures(
   dbClient: DatabaseInstance,
   ids: string[],
): Promise<{ deletedCount: number }> {
   try {
      if (!ids || ids.length === 0) {
         return { deletedCount: 0 };
      }

      const result = await dbClient
         .delete(competitorFeature)
         .where(inArray(competitorFeature.id, ids))
         .returning();

      return { deletedCount: result.length };
   } catch (err) {
      throw AppError.database(
         `Failed to bulk delete competitor features: ${(err as Error).message}`,
      );
   }
}

export async function deleteFeaturesByCompetitorId(
   dbClient: DatabaseInstance,
   competitorId: string,
): Promise<{ deletedCount: number }> {
   try {
      const result = await dbClient
         .delete(competitorFeature)
         .where(eq(competitorFeature.competitorId, competitorId))
         .returning();

      return { deletedCount: result.length };
   } catch (err) {
      throw AppError.database(
         `Failed to delete competitor features by competitor ID: ${(err as Error).message}`,
      );
   }
}

export async function getFeaturesStats(
   dbClient: DatabaseInstance,
   {
      userId,
      organizationId,
      days = 30,
   }: {
      userId?: string;
      organizationId?: string;
      days?: number;
   },
): Promise<{
   totalFeatures: number;
   totalCompetitors: number;
   avgFeaturesPerCompetitor: number;
}> {
   try {
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const ownerExists = buildOwnerExists(userId, organizationId);

      const featuresResult = await dbClient
         .select({ value: sql<number>`cast(count(*) as int)` })
         .from(competitorFeature)
         .where(
            and(
               sql`${competitorFeature.extractedAt} >= ${cutoffDate}`,
               ownerExists,
            ),
         );

      const competitorsResult = await dbClient
         .select({
            value: sql<number>`cast(count(DISTINCT ${competitorFeature.competitorId}) as int)`,
         })
         .from(competitorFeature)
         .where(
            and(
               sql`${competitorFeature.extractedAt} >= ${cutoffDate}`,
               ownerExists,
            ),
         );

      const totalFeatures = featuresResult[0]?.value ?? 0;
      const totalCompetitors = competitorsResult[0]?.value ?? 0;
      const avgFeaturesPerCompetitor =
         totalCompetitors > 0 ? totalFeatures / totalCompetitors : 0;

      return {
         totalFeatures,
         totalCompetitors,
         avgFeaturesPerCompetitor,
      };
   } catch (err) {
      throw AppError.database(
         `Failed to get competitor features stats: ${(err as Error).message}`,
      );
   }
}
