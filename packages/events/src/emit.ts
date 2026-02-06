import type { DatabaseInstance } from "@packages/database/client";
import { events } from "@packages/database/schemas/events";
import type { PostHog } from "@packages/posthog/server";

import type { EventCategory, EventName } from "./catalog";
import { getEventPrice } from "./utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EmitEventParams {
   db: DatabaseInstance;
   posthog?: PostHog;
   organizationId: string;
   eventName: EventName;
   eventCategory: EventCategory;
   properties: Record<string, unknown>;
   userId?: string;
   ipAddress?: string;
   userAgent?: string;
}

export interface EmitEventBatchParams {
   db: DatabaseInstance;
   posthog?: PostHog;
   events: Omit<EmitEventParams, "db" | "posthog">[];
}

// ---------------------------------------------------------------------------
// Single Event Emission
// ---------------------------------------------------------------------------

/**
 * Central event emitter -- dual-write to PostgreSQL and PostHog.
 *
 * 1. Looks up the event price from the catalog.
 * 2. Inserts a row into the `events` table (billing source of truth).
 * 3. Sends a capture call to PostHog (analytics, optional).
 *
 * **Non-throwing:** errors are logged but never propagated so that event
 * tracking cannot break the caller's main flow.
 */
export async function emitEvent(params: EmitEventParams): Promise<void> {
   const {
      db,
      posthog,
      organizationId,
      eventName,
      eventCategory,
      properties,
      userId,
      ipAddress,
      userAgent,
   } = params;

   try {
      // Look up pricing from the catalog
      const pricePerEvent = await getEventPrice(db, eventName);

      // 1. Store in PostgreSQL (billing source of truth)
      await db.insert(events).values({
         organizationId,
         eventName,
         eventCategory,
         properties,
         userId,
         isBillable: true,
         pricePerEvent,
         ipAddress,
         userAgent,
      });

      // 2. Send to PostHog for analytics (optional)
      if (posthog) {
         posthog.capture({
            distinctId: userId || organizationId,
            event: eventName,
            properties: {
               ...properties,
               $groups: { organization: organizationId },
            },
            groups: { organization: organizationId },
         });
      }
   } catch (error) {
      console.error(`[Events] Failed to emit ${eventName}:`, error);
      // Don't throw -- events should not block the main flow
   }
}

// ---------------------------------------------------------------------------
// Batch Event Emission
// ---------------------------------------------------------------------------

/**
 * Emits multiple events in a single operation.
 *
 * - PostgreSQL rows are inserted in a single bulk `INSERT`.
 * - PostHog captures are sent individually (the SDK batches internally).
 *
 * **Non-throwing:** errors are logged but never propagated.
 */
export async function emitEventBatch(
   params: EmitEventBatchParams,
): Promise<void> {
   const { db, posthog, events: eventList } = params;

   if (eventList.length === 0) return;

   try {
      // Look up prices for all unique event names
      const uniqueNames = [...new Set(eventList.map((e) => e.eventName))];
      const priceMap = new Map<EventName, string>();

      await Promise.all(
         uniqueNames.map(async (name) => {
            const price = await getEventPrice(db, name);
            priceMap.set(name, price);
         }),
      );

      // 1. Bulk insert into PostgreSQL
      const rows = eventList.map((evt) => ({
         organizationId: evt.organizationId,
         eventName: evt.eventName,
         eventCategory: evt.eventCategory,
         properties: evt.properties,
         userId: evt.userId,
         isBillable: true as const,
         pricePerEvent: priceMap.get(evt.eventName) ?? "0",
         ipAddress: evt.ipAddress,
         userAgent: evt.userAgent,
      }));

      await db.insert(events).values(rows);

      // 2. Send each event to PostHog (the SDK batches internally)
      if (posthog) {
         for (const evt of eventList) {
            posthog.capture({
               distinctId: evt.userId || evt.organizationId,
               event: evt.eventName,
               properties: {
                  ...evt.properties,
                  $groups: { organization: evt.organizationId },
               },
               groups: { organization: evt.organizationId },
            });
         }
      }
   } catch (error) {
      console.error(
         `[Events] Failed to emit batch of ${eventList.length} events:`,
         error,
      );
      // Don't throw -- events should not block the main flow
   }
}
