import {
   createMoney,
   type Money,
   parseDecimalToMinorUnits,
} from "@f-o-t/money";
import type { DatabaseInstance } from "@packages/database/client";
import { eventCatalog } from "@packages/database/schemas/event-catalog";
import { eq } from "drizzle-orm";

const PRICE_SCALE = 6;
const CURRENCY = "BRL";

/**
 * Looks up the price and billability for a given event name from the event_catalog table.
 * Returns a Money object with 6-decimal precision matching the DB schema.
 * Returns { price: $0, isBillable: false } if the event is not found in the catalog.
 */
export async function getEventPrice(
   db: DatabaseInstance,
   eventName: string,
): Promise<{ price: Money; isBillable: boolean }> {
   const [catalogEntry] = await db
      .select({
         pricePerEvent: eventCatalog.pricePerEvent,
         isBillable: eventCatalog.isBillable,
      })
      .from(eventCatalog)
      .where(eq(eventCatalog.eventName, eventName))
      .limit(1);

   if (!catalogEntry) {
      console.warn(
         `[Events] Event not found in catalog: ${eventName}, defaulting to $0`,
      );
      return {
         price: createMoney(0n, CURRENCY, PRICE_SCALE),
         isBillable: false,
      };
   }

   return {
      price: createMoney(
         parseDecimalToMinorUnits(catalogEntry.pricePerEvent, PRICE_SCALE),
         CURRENCY,
         PRICE_SCALE,
      ),
      isBillable: catalogEntry.isBillable,
   };
}

/**
 * Retrieves full metadata for an event from the catalog.
 * Returns null if the event is not found.
 */
export async function getEventMetadata(
   db: DatabaseInstance,
   eventName: string,
) {
   const [catalogEntry] = await db
      .select()
      .from(eventCatalog)
      .where(eq(eventCatalog.eventName, eventName))
      .limit(1);

   return catalogEntry || null;
}
