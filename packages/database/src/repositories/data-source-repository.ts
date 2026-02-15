import { AppError, propagateError } from "@packages/utils/errors";
import { desc, eq } from "drizzle-orm";
import type { DatabaseInstance } from "../client";
import { dataSources, type NewDataSource } from "../schemas/data-sources";

export async function createDataSource(
   db: DatabaseInstance,
   data: Omit<NewDataSource, "id" | "createdAt" | "updatedAt">,
) {
   try {
      const [source] = await db.insert(dataSources).values(data).returning();

      return source;
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to create data source");
   }
}

export async function listDataSources(
   db: DatabaseInstance,
   organizationId: string,
) {
   try {
      return await db
         .select()
         .from(dataSources)
         .where(eq(dataSources.organizationId, organizationId))
         .orderBy(desc(dataSources.createdAt));
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to list data sources");
   }
}

export async function getDataSource(db: DatabaseInstance, id: string) {
   try {
      const [source] = await db
         .select()
         .from(dataSources)
         .where(eq(dataSources.id, id))
         .limit(1);

      return source ?? null;
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to get data source");
   }
}

export async function updateDataSource(
   db: DatabaseInstance,
   id: string,
   data: Partial<
      Pick<NewDataSource, "name" | "description" | "config" | "isActive">
   >,
) {
   try {
      const [updated] = await db
         .update(dataSources)
         .set(data)
         .where(eq(dataSources.id, id))
         .returning();

      return updated;
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to update data source");
   }
}

export async function deleteDataSource(db: DatabaseInstance, id: string) {
   try {
      await db.delete(dataSources).where(eq(dataSources.id, id));
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to delete data source");
   }
}
