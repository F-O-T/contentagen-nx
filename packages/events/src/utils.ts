import type { DatabaseInstance } from "@packages/database/client";
import { eventCatalog } from "@packages/database/schemas/event-catalog";
import { eq } from "drizzle-orm";

import type { EventName } from "./catalog";

/**
 * Looks up the price for a given event name from the event_catalog table.
 * Returns "0" if the event is not found in the catalog.
 */
export async function getEventPrice(
   db: DatabaseInstance,
   eventName: EventName,
): Promise<string> {
   const [catalogEntry] = await db
      .select({ pricePerEvent: eventCatalog.pricePerEvent })
      .from(eventCatalog)
      .where(eq(eventCatalog.eventName, eventName))
      .limit(1);

   if (!catalogEntry) {
      console.warn(
         `[Events] Event not found in catalog: ${eventName}, defaulting to $0`,
      );
      return "0";
   }

   return catalogEntry.pricePerEvent;
}

/**
 * Retrieves full metadata for an event from the catalog.
 * Returns null if the event is not found.
 */
export async function getEventMetadata(
   db: DatabaseInstance,
   eventName: EventName,
) {
   const [catalogEntry] = await db
      .select()
      .from(eventCatalog)
      .where(eq(eventCatalog.eventName, eventName))
      .limit(1);

   return catalogEntry || null;
}
