import { AppError, propagateError } from "@packages/utils/errors";
import { asc, eq } from "drizzle-orm";
import type { DatabaseInstance } from "../client";
import {
   eventCatalog,
   type NewEventCatalogEntry,
} from "../schemas/event-catalog";

export async function listEventCatalog(db: DatabaseInstance) {
   try {
      return await db
         .select()
         .from(eventCatalog)
         .orderBy(asc(eventCatalog.category), asc(eventCatalog.eventName));
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to list event catalog");
   }
}

export async function getEventCatalogEntry(
   db: DatabaseInstance,
   eventName: string,
) {
   try {
      const [entry] = await db
         .select()
         .from(eventCatalog)
         .where(eq(eventCatalog.eventName, eventName))
         .limit(1);

      return entry ?? null;
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to get event catalog entry");
   }
}

export async function updateEventCatalogEntry(
   db: DatabaseInstance,
   id: string,
   data: Partial<
      Pick<NewEventCatalogEntry, "description" | "isActive" | "displayName">
   >,
) {
   try {
      const [updated] = await db
         .update(eventCatalog)
         .set(data)
         .where(eq(eventCatalog.id, id))
         .returning();

      return updated;
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to update event catalog entry");
   }
}
