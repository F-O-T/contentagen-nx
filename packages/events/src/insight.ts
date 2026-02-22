import { z } from "zod";

import { type EmitFn, EVENT_CATEGORIES } from "./catalog";

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
// Insight Pricing
// ---------------------------------------------------------------------------

export const INSIGHT_PRICING: Record<string, string> = {
   "insight.created": "0.000000",
   "insight.updated": "0.000000",
   "insight.deleted": "0.000000",
};

// ---------------------------------------------------------------------------
// insight.created
// ---------------------------------------------------------------------------

export const insightCreatedEventSchema = z.object({
   insightId: z.string().uuid(),
   name: z.string(),
});
export type InsightCreatedEvent = z.infer<typeof insightCreatedEventSchema>;

export function emitInsightCreated(
   emit: EmitFn,
   ctx: { organizationId: string; userId?: string; teamId?: string },
   properties: InsightCreatedEvent,
) {
   return emit({
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
   emit: EmitFn,
   ctx: { organizationId: string; userId?: string; teamId?: string },
   properties: InsightUpdatedEvent,
) {
   return emit({
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
   emit: EmitFn,
   ctx: { organizationId: string; userId?: string; teamId?: string },
   properties: InsightDeletedEvent,
) {
   return emit({
      ...ctx,
      eventName: INSIGHT_EVENTS["insight.deleted"],
      eventCategory: EVENT_CATEGORIES.insight,
      properties,
   });
}
