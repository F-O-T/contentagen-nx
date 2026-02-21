import { AppError, propagateError } from "@packages/utils/errors";
import {
   and,
   arrayContains,
   count,
   desc,
   eq,
   ilike,
   isNull,
   or,
   type SQL,
} from "drizzle-orm";
import type { DatabaseInstance } from "../client";
import { type Asset, type AssetInsert, assets } from "../schemas/assets";

export type ListAssetsFilters = {
   organizationId: string;
   teamId?: string | null;
   search?: string;
   tags?: string[];
   limit?: number;
   offset?: number;
};

export async function createAsset(
   db: DatabaseInstance,
   data: AssetInsert,
): Promise<Asset> {
   try {
      const result = await db.insert(assets).values(data).returning();
      // biome-ignore lint/style/noNonNullAssertion: insert always returns a row
      return result[0]!;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to create asset: ${(err as Error).message}`,
      );
   }
}

export async function getAssetById(
   db: DatabaseInstance,
   id: string,
   organizationId: string,
): Promise<Asset | undefined> {
   try {
      const result = await db
         .select()
         .from(assets)
         .where(
            and(eq(assets.id, id), eq(assets.organizationId, organizationId)),
         )
         .limit(1);
      return result[0];
   } catch (err) {
      propagateError(err);
      throw AppError.database(`Failed to get asset: ${(err as Error).message}`);
   }
}

export async function listAssets(
   db: DatabaseInstance,
   filters: ListAssetsFilters,
): Promise<{ items: Asset[]; total: number }> {
   const {
      organizationId,
      teamId,
      search,
      tags,
      limit = 24,
      offset = 0,
   } = filters;

   try {
      const conditions: SQL[] = [eq(assets.organizationId, organizationId)];

      if (teamId === null) {
         conditions.push(isNull(assets.teamId));
      } else if (teamId !== undefined) {
         conditions.push(eq(assets.teamId, teamId));
      }

      if (search) {
         const searchCondition = or(
            ilike(assets.filename, `%${search}%`),
            ilike(assets.alt, `%${search}%`),
            ilike(assets.caption, `%${search}%`),
         );
         if (searchCondition) {
            conditions.push(searchCondition);
         }
      }

      if (tags && tags.length > 0) {
         conditions.push(arrayContains(assets.tags, tags));
      }

      const where = and(...conditions);

      const [itemsResult, countResult] = await Promise.all([
         db
            .select()
            .from(assets)
            .where(where)
            .orderBy(desc(assets.createdAt))
            .limit(limit)
            .offset(offset),
         db.select({ count: count() }).from(assets).where(where),
      ]);

      return {
         items: itemsResult,
         total: Number(countResult[0]?.count ?? 0),
      };
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to list assets: ${(err as Error).message}`,
      );
   }
}

export async function updateAsset(
   db: DatabaseInstance,
   id: string,
   organizationId: string,
   data: Partial<
      Pick<Asset, "alt" | "caption" | "tags" | "thumbnailKey" | "filename">
   >,
): Promise<Asset> {
   try {
      const result = await db
         .update(assets)
         .set({ ...data, updatedAt: new Date() })
         .where(
            and(eq(assets.id, id), eq(assets.organizationId, organizationId)),
         )
         .returning();

      if (!result.length) {
         throw AppError.database("Asset not found");
      }
      // biome-ignore lint/style/noNonNullAssertion: length check above guarantees element
      return result[0]!;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to update asset: ${(err as Error).message}`,
      );
   }
}

export async function deleteAsset(
   db: DatabaseInstance,
   id: string,
   organizationId: string,
): Promise<Asset> {
   try {
      const result = await db
         .delete(assets)
         .where(
            and(eq(assets.id, id), eq(assets.organizationId, organizationId)),
         )
         .returning();

      if (!result.length) {
         throw AppError.database("Asset not found");
      }
      // biome-ignore lint/style/noNonNullAssertion: length check above guarantees element
      return result[0]!;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to delete asset: ${(err as Error).message}`,
      );
   }
}
