import { z } from "zod";

import { EVENT_CATEGORIES } from "./catalog";
import { type EmitEventParams, emitEvent } from "./emit";

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
   ctx: Pick<EmitEventParams, "db" | "posthog" | "organizationId" | "userId" | "teamId">,
   properties: PageViewEvent,
) {
   return emitEvent({
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
   ctx: Pick<EmitEventParams, "db" | "posthog" | "organizationId" | "userId" | "teamId">,
   properties: ContentPublishedEvent,
) {
   return emitEvent({
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
   ctx: Pick<EmitEventParams, "db" | "posthog" | "organizationId" | "userId" | "teamId">,
   properties: ContentUpdatedEvent,
) {
   return emitEvent({
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
   ctx: Pick<EmitEventParams, "db" | "posthog" | "organizationId" | "userId" | "teamId">,
   properties: ContentCreatedEvent,
) {
   return emitEvent({
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
   ctx: Pick<EmitEventParams, "db" | "posthog" | "organizationId" | "userId" | "teamId">,
   properties: ContentDeletedEvent,
) {
   return emitEvent({
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
   ctx: Pick<EmitEventParams, "db" | "posthog" | "organizationId" | "userId" | "teamId">,
   properties: ScrollMilestoneEvent,
) {
   return emitEvent({
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
   ctx: Pick<EmitEventParams, "db" | "posthog" | "organizationId" | "userId" | "teamId">,
   properties: TimeSpentEvent,
) {
   return emitEvent({
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
   ctx: Pick<EmitEventParams, "db" | "posthog" | "organizationId" | "userId" | "teamId">,
   properties: CtaClickEvent,
) {
   return emitEvent({
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
   ctx: Pick<EmitEventParams, "db" | "posthog" | "organizationId" | "userId" | "teamId">,
   properties: ContentExportedEvent,
) {
   return emitEvent({
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
   ctx: Pick<EmitEventParams, "db" | "posthog" | "organizationId" | "userId" | "teamId">,
   properties: ContentArchivedEvent,
) {
   return emitEvent({
      ...ctx,
      eventName: CONTENT_EVENTS["content.archived"],
      eventCategory: EVENT_CATEGORIES.content,
      properties,
   });
}
