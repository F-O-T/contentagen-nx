import { z } from "zod";

import { type EmitFn, EVENT_CATEGORIES } from "./catalog";

// ---------------------------------------------------------------------------
// Content Event Names
// ---------------------------------------------------------------------------

export const CONTENT_EVENTS = {
   "content.page.view": "content.page.view",
   "content.page.published": "content.page.published",
   "content.page.updated": "content.page.updated",
   "content.created": "content.created",
   "content.deleted": "content.deleted",
   "content.scroll.milestone": "content.scroll.milestone",
   "content.time.spent": "content.time.spent",
   "content.cta.click": "content.cta.click",
   "content.exported": "content.exported",
   "content.archived": "content.archived",
} as const;

export type ContentEventName =
   (typeof CONTENT_EVENTS)[keyof typeof CONTENT_EVENTS];

// ---------------------------------------------------------------------------
// Content Pricing
// ---------------------------------------------------------------------------

export const CONTENT_PRICING: Record<string, string> = {
   "content.page.view": "0.000020",
   "content.page.published": "0.001000",
   "content.page.updated": "0.000500",
   "content.created": "0.000000",
   "content.deleted": "0.000000",
   "content.scroll.milestone": "0.000000",
   "content.time.spent": "0.000000",
   "content.cta.click": "0.000000",
   "content.exported": "0.001000",
   "content.archived": "0.000000",
};

// ---------------------------------------------------------------------------
// Shared enums
// ---------------------------------------------------------------------------

export const trafficSourceSchema = z.enum([
   "organic",
   "direct",
   "referral",
   "social",
   "email",
   "paid",
]);
export type TrafficSource = z.infer<typeof trafficSourceSchema>;

export const deviceTypeSchema = z.enum(["desktop", "mobile", "tablet"]);
export type DeviceType = z.infer<typeof deviceTypeSchema>;

export const scrollDepthSchema = z.union([
   z.literal(25),
   z.literal(50),
   z.literal(75),
   z.literal(100),
]);
export type ScrollDepth = z.infer<typeof scrollDepthSchema>;

// ---------------------------------------------------------------------------
// content.page.view
// ---------------------------------------------------------------------------

export const pageViewEventSchema = z.object({
   contentId: z.string().uuid(),
   url: z.string().url(),
   referrer: z.string().optional(),
   trafficSource: trafficSourceSchema.optional(),
   deviceType: deviceTypeSchema.optional(),
   country: z.string().optional(),
   sessionId: z.string().optional(),
   visitorId: z.string().optional(),
});
export type PageViewEvent = z.infer<typeof pageViewEventSchema>;

export function emitContentPageView(
   emit: EmitFn,
   ctx: { organizationId: string; userId?: string; teamId?: string },
   properties: PageViewEvent,
) {
   return emit({
      ...ctx,
      eventName: CONTENT_EVENTS["content.page.view"],
      eventCategory: EVENT_CATEGORIES.content,
      properties,
   });
}

// ---------------------------------------------------------------------------
// content.page.published
// ---------------------------------------------------------------------------

export const contentPublishedEventSchema = z.object({
   contentId: z.string().uuid(),
   agentId: z.string().uuid().optional(),
   title: z.string(),
   slug: z.string(),
   wordCount: z.number().int().nonnegative(),
});
export type ContentPublishedEvent = z.infer<typeof contentPublishedEventSchema>;

export function emitContentPublished(
   emit: EmitFn,
   ctx: { organizationId: string; userId?: string; teamId?: string },
   properties: ContentPublishedEvent,
) {
   return emit({
      ...ctx,
      eventName: CONTENT_EVENTS["content.page.published"],
      eventCategory: EVENT_CATEGORIES.content,
      properties,
   });
}

// ---------------------------------------------------------------------------
// content.page.updated
// ---------------------------------------------------------------------------

export const contentUpdatedEventSchema = z.object({
   contentId: z.string().uuid(),
   changedFields: z.array(z.string()),
   previousWordCount: z.number().int().nonnegative().optional(),
   newWordCount: z.number().int().nonnegative().optional(),
});
export type ContentUpdatedEvent = z.infer<typeof contentUpdatedEventSchema>;

export function emitContentUpdated(
   emit: EmitFn,
   ctx: { organizationId: string; userId?: string; teamId?: string },
   properties: ContentUpdatedEvent,
) {
   return emit({
      ...ctx,
      eventName: CONTENT_EVENTS["content.page.updated"],
      eventCategory: EVENT_CATEGORIES.content,
      properties,
   });
}

// ---------------------------------------------------------------------------
// content.created
// ---------------------------------------------------------------------------

export const contentCreatedEventSchema = z.object({
   contentId: z.string().uuid(),
   title: z.string(),
   agentId: z.string().uuid().optional(),
});
export type ContentCreatedEvent = z.infer<typeof contentCreatedEventSchema>;

export function emitContentCreated(
   emit: EmitFn,
   ctx: { organizationId: string; userId?: string; teamId?: string },
   properties: ContentCreatedEvent,
) {
   return emit({
      ...ctx,
      eventName: CONTENT_EVENTS["content.created"],
      eventCategory: EVENT_CATEGORIES.content,
      properties,
   });
}

// ---------------------------------------------------------------------------
// content.deleted
// ---------------------------------------------------------------------------

export const contentDeletedEventSchema = z.object({
   contentId: z.string().uuid(),
});
export type ContentDeletedEvent = z.infer<typeof contentDeletedEventSchema>;

export function emitContentDeleted(
   emit: EmitFn,
   ctx: { organizationId: string; userId?: string; teamId?: string },
   properties: ContentDeletedEvent,
) {
   return emit({
      ...ctx,
      eventName: CONTENT_EVENTS["content.deleted"],
      eventCategory: EVENT_CATEGORIES.content,
      properties,
   });
}

// ---------------------------------------------------------------------------
// content.scroll.milestone
// ---------------------------------------------------------------------------

export const scrollMilestoneEventSchema = z.object({
   contentId: z.string().uuid(),
   depth: scrollDepthSchema,
   sessionId: z.string().optional(),
   visitorId: z.string().optional(),
});
export type ScrollMilestoneEvent = z.infer<typeof scrollMilestoneEventSchema>;

export function emitScrollMilestone(
   emit: EmitFn,
   ctx: { organizationId: string; userId?: string; teamId?: string },
   properties: ScrollMilestoneEvent,
) {
   return emit({
      ...ctx,
      eventName: CONTENT_EVENTS["content.scroll.milestone"],
      eventCategory: EVENT_CATEGORIES.content,
      properties,
   });
}

// ---------------------------------------------------------------------------
// content.time.spent
// ---------------------------------------------------------------------------

export const timeSpentEventSchema = z.object({
   contentId: z.string().uuid(),
   durationSeconds: z.number().nonnegative(),
   sessionId: z.string().optional(),
   visitorId: z.string().optional(),
});
export type TimeSpentEvent = z.infer<typeof timeSpentEventSchema>;

export function emitTimeSpent(
   emit: EmitFn,
   ctx: { organizationId: string; userId?: string; teamId?: string },
   properties: TimeSpentEvent,
) {
   return emit({
      ...ctx,
      eventName: CONTENT_EVENTS["content.time.spent"],
      eventCategory: EVENT_CATEGORIES.content,
      properties,
   });
}

// ---------------------------------------------------------------------------
// content.cta.click
// ---------------------------------------------------------------------------

export const ctaClickEventSchema = z.object({
   contentId: z.string().uuid(),
   ctaId: z.string(),
   ctaLabel: z.string().optional(),
   ctaUrl: z.string().url().optional(),
   sessionId: z.string().optional(),
   visitorId: z.string().optional(),
});
export type CtaClickEvent = z.infer<typeof ctaClickEventSchema>;

export function emitCtaClick(
   emit: EmitFn,
   ctx: { organizationId: string; userId?: string; teamId?: string },
   properties: CtaClickEvent,
) {
   return emit({
      ...ctx,
      eventName: CONTENT_EVENTS["content.cta.click"],
      eventCategory: EVENT_CATEGORIES.content,
      properties,
   });
}

// ---------------------------------------------------------------------------
// content.exported
// ---------------------------------------------------------------------------

export const contentExportedEventSchema = z.object({
   contentId: z.string().uuid(),
   exportFormat: z.string(),
   destination: z.string().optional(),
});
export type ContentExportedEvent = z.infer<typeof contentExportedEventSchema>;

export function emitContentExported(
   emit: EmitFn,
   ctx: { organizationId: string; userId?: string; teamId?: string },
   properties: ContentExportedEvent,
) {
   return emit({
      ...ctx,
      eventName: CONTENT_EVENTS["content.exported"],
      eventCategory: EVENT_CATEGORIES.content,
      properties,
   });
}

// ---------------------------------------------------------------------------
// content.archived
// ---------------------------------------------------------------------------

export const contentArchivedEventSchema = z.object({
   contentId: z.string().uuid(),
});
export type ContentArchivedEvent = z.infer<typeof contentArchivedEventSchema>;

export function emitContentArchived(
   emit: EmitFn,
   ctx: { organizationId: string; userId?: string; teamId?: string },
   properties: ContentArchivedEvent,
) {
   return emit({
      ...ctx,
      eventName: CONTENT_EVENTS["content.archived"],
      eventCategory: EVENT_CATEGORIES.content,
      properties,
   });
}
