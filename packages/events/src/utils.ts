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

// ---------------------------------------------------------------------------
// Image Generation Pricing
// ---------------------------------------------------------------------------

export const IMAGE_MODEL_PRICING: Record<string, string> = {
   "sourceful/riverflow-v2-pro": "0.900000",
   "bytedance-seed/seedream-4.5": "0.240000",
};

export function getImageGenerationPrice(model: string): Money {
   const amount =
      IMAGE_MODEL_PRICING[model] ??
      IMAGE_MODEL_PRICING["sourceful/riverflow-v2-pro"] ??
      "0.900000";
   return createMoney(
      parseDecimalToMinorUnits(amount, PRICE_SCALE),
      CURRENCY,
      PRICE_SCALE,
   );
}

/**
 * Looks up the price for a given event name from the event_catalog table.
 * Returns a Money object with 6-decimal precision matching the DB schema.
 * Returns $0.000000 if the event is not found in the catalog.
 */
export async function getEventPrice(
   db: DatabaseInstance,
   eventName: string,
): Promise<Money> {
   const [catalogEntry] = await db
      .select({ pricePerEvent: eventCatalog.pricePerEvent })
      .from(eventCatalog)
      .where(eq(eventCatalog.eventName, eventName))
      .limit(1);

   if (!catalogEntry) {
      console.warn(
         `[Events] Event not found in catalog: ${eventName}, defaulting to $0`,
      );
      return createMoney(0n, CURRENCY, PRICE_SCALE);
   }

   return createMoney(
      parseDecimalToMinorUnits(catalogEntry.pricePerEvent, PRICE_SCALE),
      CURRENCY,
      PRICE_SCALE,
   );
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
