import { z } from "zod";

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
   organizationId: z.string().uuid(),
   url: z.string().url(),
   referrer: z.string().optional(),
   trafficSource: trafficSourceSchema,
   deviceType: deviceTypeSchema,
   country: z.string().optional(),
   sessionId: z.string().optional(),
   visitorId: z.string().optional(),
   timestamp: z.string().datetime(),
});
export type PageViewEvent = z.infer<typeof pageViewEventSchema>;

// ---------------------------------------------------------------------------
// content.page.published
// ---------------------------------------------------------------------------

export const contentPublishedEventSchema = z.object({
   contentId: z.string().uuid(),
   organizationId: z.string().uuid(),
   agentId: z.string().uuid().optional(),
   title: z.string(),
   slug: z.string(),
   wordCount: z.number().int().nonnegative(),
   timestamp: z.string().datetime(),
});
export type ContentPublishedEvent = z.infer<typeof contentPublishedEventSchema>;

// ---------------------------------------------------------------------------
// content.page.updated
// ---------------------------------------------------------------------------

export const contentUpdatedEventSchema = z.object({
   contentId: z.string().uuid(),
   organizationId: z.string().uuid(),
   changedFields: z.array(z.string()),
   previousWordCount: z.number().int().nonnegative().optional(),
   newWordCount: z.number().int().nonnegative().optional(),
   timestamp: z.string().datetime(),
});
export type ContentUpdatedEvent = z.infer<typeof contentUpdatedEventSchema>;

// ---------------------------------------------------------------------------
// content.scroll.milestone
// ---------------------------------------------------------------------------

export const scrollMilestoneEventSchema = z.object({
   contentId: z.string().uuid(),
   organizationId: z.string().uuid(),
   depth: scrollDepthSchema,
   sessionId: z.string().optional(),
   visitorId: z.string().optional(),
   timestamp: z.string().datetime(),
});
export type ScrollMilestoneEvent = z.infer<typeof scrollMilestoneEventSchema>;

// ---------------------------------------------------------------------------
// content.time.spent
// ---------------------------------------------------------------------------

export const timeSpentEventSchema = z.object({
   contentId: z.string().uuid(),
   organizationId: z.string().uuid(),
   /** Duration in seconds */
   durationSeconds: z.number().nonnegative(),
   sessionId: z.string().optional(),
   visitorId: z.string().optional(),
   timestamp: z.string().datetime(),
});
export type TimeSpentEvent = z.infer<typeof timeSpentEventSchema>;

// ---------------------------------------------------------------------------
// content.cta.click
// ---------------------------------------------------------------------------

export const ctaClickEventSchema = z.object({
   contentId: z.string().uuid(),
   organizationId: z.string().uuid(),
   ctaId: z.string(),
   ctaLabel: z.string().optional(),
   ctaUrl: z.string().url().optional(),
   sessionId: z.string().optional(),
   visitorId: z.string().optional(),
   timestamp: z.string().datetime(),
});
export type CtaClickEvent = z.infer<typeof ctaClickEventSchema>;
