import { z } from "zod";

import { EVENT_CATEGORIES } from "./catalog";
import { type EmitEventParams, emitEvent } from "./emit";

// ---------------------------------------------------------------------------
// Webhook Event Names
// ---------------------------------------------------------------------------

export const WEBHOOK_EVENTS = {
   "webhook.endpoint.created": "webhook.endpoint.created",
   "webhook.endpoint.updated": "webhook.endpoint.updated",
   "webhook.endpoint.deleted": "webhook.endpoint.deleted",
   "webhook.delivered": "webhook.delivered",
} as const;

export type WebhookEventName =
   (typeof WEBHOOK_EVENTS)[keyof typeof WEBHOOK_EVENTS];

// ---------------------------------------------------------------------------
// webhook.endpoint.created
// ---------------------------------------------------------------------------

export const webhookEndpointCreatedEventSchema = z.object({
   endpointId: z.string().uuid(),
   url: z.string().url(),
});
export type WebhookEndpointCreatedEvent = z.infer<
   typeof webhookEndpointCreatedEventSchema
>;

export function emitWebhookEndpointCreated(
   ctx: Pick<
      EmitEventParams,
      "db" | "posthog" | "organizationId" | "userId" | "teamId"
   >,
   properties: WebhookEndpointCreatedEvent,
) {
   return emitEvent({
      ...ctx,
      eventName: WEBHOOK_EVENTS["webhook.endpoint.created"],
      eventCategory: EVENT_CATEGORIES.webhook,
      properties,
   });
}

// ---------------------------------------------------------------------------
// webhook.endpoint.updated
// ---------------------------------------------------------------------------

export const webhookEndpointUpdatedEventSchema = z.object({
   endpointId: z.string().uuid(),
   changedFields: z.array(z.string()),
});
export type WebhookEndpointUpdatedEvent = z.infer<
   typeof webhookEndpointUpdatedEventSchema
>;

export function emitWebhookEndpointUpdated(
   ctx: Pick<
      EmitEventParams,
      "db" | "posthog" | "organizationId" | "userId" | "teamId"
   >,
   properties: WebhookEndpointUpdatedEvent,
) {
   return emitEvent({
      ...ctx,
      eventName: WEBHOOK_EVENTS["webhook.endpoint.updated"],
      eventCategory: EVENT_CATEGORIES.webhook,
      properties,
   });
}

// ---------------------------------------------------------------------------
// webhook.endpoint.deleted
// ---------------------------------------------------------------------------

export const webhookEndpointDeletedEventSchema = z.object({
   endpointId: z.string().uuid(),
});
export type WebhookEndpointDeletedEvent = z.infer<
   typeof webhookEndpointDeletedEventSchema
>;

export function emitWebhookEndpointDeleted(
   ctx: Pick<
      EmitEventParams,
      "db" | "posthog" | "organizationId" | "userId" | "teamId"
   >,
   properties: WebhookEndpointDeletedEvent,
) {
   return emitEvent({
      ...ctx,
      eventName: WEBHOOK_EVENTS["webhook.endpoint.deleted"],
      eventCategory: EVENT_CATEGORIES.webhook,
      properties,
   });
}

// ---------------------------------------------------------------------------
// webhook.delivered
// ---------------------------------------------------------------------------

export const webhookDeliveredEventSchema = z.object({
   endpointId: z.string().uuid(),
   eventName: z.string(),
   statusCode: z.number().int(),
});
export type WebhookDeliveredEvent = z.infer<typeof webhookDeliveredEventSchema>;

export function emitWebhookDelivered(
   ctx: Pick<
      EmitEventParams,
      "db" | "posthog" | "organizationId" | "userId" | "teamId"
   >,
   properties: WebhookDeliveredEvent,
) {
   return emitEvent({
      ...ctx,
      eventName: WEBHOOK_EVENTS["webhook.delivered"],
      eventCategory: EVENT_CATEGORIES.webhook,
      properties,
   });
}
