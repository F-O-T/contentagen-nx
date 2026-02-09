import { z } from "zod";

import { EVENT_CATEGORIES } from "./catalog";
import { type EmitEventParams, emitEvent } from "./emit";

// ---------------------------------------------------------------------------
// Insight Event Names
// ---------------------------------------------------------------------------

export const INSIGHT_EVENTS = {
   "insight.created": "insight.created",
   "insight.updated": "insight.updated",
   "insight.deleted": "insight.deleted",
} as const;

export type InsightEventName =
   (typeof INSIGHT_EVENTS)[keyof typeof INSIGHT_EVENTS];

// ---------------------------------------------------------------------------
// insight.created
// ---------------------------------------------------------------------------

export const insightCreatedEventSchema = z.object({
   insightId: z.string().uuid(),
   name: z.string(),
});
export type InsightCreatedEvent = z.infer<typeof insightCreatedEventSchema>;

export function emitInsightCreated(
   ctx: Pick<EmitEventParams, "db" | "posthog" | "organizationId" | "userId" | "teamId">,
   properties: InsightCreatedEvent,
) {
   return emitEvent({
      ...ctx,
      eventName: INSIGHT_EVENTS["insight.created"],
      eventCategory: EVENT_CATEGORIES.insight,
      properties,
   });
}

// ---------------------------------------------------------------------------
// insight.updated
// ---------------------------------------------------------------------------

export const insightUpdatedEventSchema = z.object({
   insightId: z.string().uuid(),
   changedFields: z.array(z.string()),
});
export type InsightUpdatedEvent = z.infer<typeof insightUpdatedEventSchema>;

export function emitInsightUpdated(
   ctx: Pick<EmitEventParams, "db" | "posthog" | "organizationId" | "userId" | "teamId">,
   properties: InsightUpdatedEvent,
) {
   return emitEvent({
      ...ctx,
      eventName: INSIGHT_EVENTS["insight.updated"],
      eventCategory: EVENT_CATEGORIES.insight,
      properties,
   });
}

// ---------------------------------------------------------------------------
// insight.deleted
// ---------------------------------------------------------------------------

export const insightDeletedEventSchema = z.object({
   insightId: z.string().uuid(),
});
export type InsightDeletedEvent = z.infer<typeof insightDeletedEventSchema>;

export function emitInsightDeleted(
   ctx: Pick<EmitEventParams, "db" | "posthog" | "organizationId" | "userId" | "teamId">,
   properties: InsightDeletedEvent,
) {
   return emitEvent({
      ...ctx,
      eventName: INSIGHT_EVENTS["insight.deleted"],
      eventCategory: EVENT_CATEGORIES.insight,
      properties,
   });
}
