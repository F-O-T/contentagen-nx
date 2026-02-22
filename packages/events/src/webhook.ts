import { z } from "zod";

import { type EmitFn, EVENT_CATEGORIES } from "./catalog";

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
// Webhook Pricing
// ---------------------------------------------------------------------------

export const WEBHOOK_PRICING: Record<string, string> = {
   "webhook.endpoint.created": "0.000000",
   "webhook.endpoint.updated": "0.000000",
   "webhook.endpoint.deleted": "0.000000",
   "webhook.delivered": "0.000500",
};

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
   emit: EmitFn,
   ctx: { organizationId: string; userId?: string; teamId?: string },
   properties: WebhookEndpointCreatedEvent,
) {
   return emit({
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
   emit: EmitFn,
   ctx: { organizationId: string; userId?: string; teamId?: string },
   properties: WebhookEndpointUpdatedEvent,
) {
   return emit({
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
   emit: EmitFn,
   ctx: { organizationId: string; userId?: string; teamId?: string },
   properties: WebhookEndpointDeletedEvent,
) {
   return emit({
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
   emit: EmitFn,
   ctx: { organizationId: string; userId?: string; teamId?: string },
   properties: WebhookDeliveredEvent,
) {
   return emit({
      ...ctx,
      eventName: WEBHOOK_EVENTS["webhook.delivered"],
      eventCategory: EVENT_CATEGORIES.webhook,
      properties,
   });
}
