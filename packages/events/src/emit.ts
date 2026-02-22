import type { Money } from "@f-o-t/money";
import { toMajorUnitsString } from "@f-o-t/money";
import type { DatabaseInstance } from "@packages/database/client";
import {
   createWebhookDelivery,
   findMatchingWebhooks,
} from "@packages/database/repositories/webhook-repository";
import { events } from "@packages/database/schemas/events";
import type { PostHog } from "@packages/posthog/server";
import { createQueueConnection } from "@packages/queue/connection";
import {
   createWebhookDeliveryQueue,
   type WebhookDeliveryJobData,
} from "@packages/queue/webhook-delivery";
import type { Queue } from "bullmq";
import type { EmitFn, EventCategory } from "./catalog";
import { getEventPrice } from "./utils";

export interface EmitEventParams {
   db: DatabaseInstance;
   posthog?: PostHog;
   organizationId: string;
   eventName: string;
   eventCategory: EventCategory;
   properties: Record<string, unknown>;
   userId?: string;
   teamId?: string;
   ipAddress?: string;
   userAgent?: string;
   priceOverride?: Money;
}

export function createEmitFn(db: DatabaseInstance, posthog?: PostHog): EmitFn {
   return (params) => emitEvent({ ...params, db, posthog });
}

export interface EmitEventBatchParams {
   db: DatabaseInstance;
   posthog?: PostHog;
   events: Omit<EmitEventParams, "db" | "posthog">[];
}

// ---------------------------------------------------------------------------
// Webhook Queue (lazy-initialized)
// ---------------------------------------------------------------------------

let webhookQueue: Queue<WebhookDeliveryJobData> | null = null;

/**
 * Initialize the webhook delivery queue.
 * Must be called once at app startup (web or worker).
 */
export function initializeWebhookQueue(redisUrl: string): void {
   if (webhookQueue) return;
   const connection = createQueueConnection(redisUrl);
   webhookQueue = createWebhookDeliveryQueue(connection);
}

/**
 * Build the webhook payload from a stored event.
 */
function buildWebhookPayload(
   eventId: string,
   eventName: string,
   organizationId: string,
   properties: Record<string, unknown>,
): Record<string, unknown> {
   return {
      id: eventId,
      event: eventName,
      data: properties,
      created_at: new Date().toISOString(),
      organization_id: organizationId,
   };
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
 * 4. Triggers matching webhook deliveries via BullMQ (if initialized).
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
      teamId,
      ipAddress,
      userAgent,
   } = params;

   try {
      const { price, isBillable } = params.priceOverride
         ? { price: params.priceOverride, isBillable: true }
         : await getEventPrice(db, eventName);

      // 1. Store in PostgreSQL (billing source of truth)
      const [storedEvent] = await db
         .insert(events)
         .values({
            organizationId,
            eventName,
            eventCategory,
            properties,
            userId: userId ?? "",
            teamId: teamId ?? "",
            isBillable,
            pricePerEvent: toMajorUnitsString(price),
            ipAddress,
            userAgent,
         })
         .returning();

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

      // 3. Trigger webhooks (failure-tolerant)
      if (webhookQueue && storedEvent) {
         try {
            const matchingWebhooks = await findMatchingWebhooks(
               db,
               organizationId,
               eventName,
               teamId,
            );

            for (const webhook of matchingWebhooks) {
               const payload = buildWebhookPayload(
                  storedEvent.id,
                  eventName,
                  organizationId,
                  properties,
               );

               const delivery = await createWebhookDelivery(db, {
                  webhookEndpointId: webhook.id,
                  eventId: storedEvent.id,
                  url: webhook.url,
                  eventName,
                  payload,
                  status: "pending",
                  attemptNumber: 1,
                  maxAttempts: 5,
               });

               if (!delivery) continue;

               await webhookQueue.add("deliver", {
                  deliveryId: delivery.id,
                  webhookEndpointId: webhook.id,
                  eventId: storedEvent.id,
                  url: webhook.url,
                  payload,
                  signingSecret: webhook.signingSecret,
                  attemptNumber: 1,
               });
            }
         } catch (error) {
            console.error("[Events] Failed to trigger webhooks:", error);
            // Don't throw — webhooks should not block events
         }
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
      const billingMap = new Map<
         string,
         { priceStr: string; isBillable: boolean }
      >();

      await Promise.all(
         uniqueNames.map(async (name) => {
            const { price, isBillable } = await getEventPrice(db, name);
            billingMap.set(name, {
               priceStr: toMajorUnitsString(price),
               isBillable,
            });
         }),
      );

      // 1. Bulk insert into PostgreSQL
      const rows = eventList.map((evt) => {
         const billing = billingMap.get(evt.eventName) ?? {
            priceStr: "0",
            isBillable: false,
         };
         return {
            organizationId: evt.organizationId,
            eventName: evt.eventName,
            eventCategory: evt.eventCategory,
            properties: evt.properties,
            userId: evt.userId ?? "",
            teamId: evt.teamId ?? "",
            isBillable: billing.isBillable,
            pricePerEvent: billing.priceStr,
            ipAddress: evt.ipAddress,
            userAgent: evt.userAgent,
         };
      });

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
