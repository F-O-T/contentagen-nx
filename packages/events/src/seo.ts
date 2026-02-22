import { z } from "zod";

import { type EmitFn, EVENT_CATEGORIES } from "./catalog";

// ---------------------------------------------------------------------------
// SEO Event Names
// ---------------------------------------------------------------------------

export const SEO_EVENTS = {
   "seo.analyzed": "seo.analyzed",
   "seo.indexed": "seo.indexed",
} as const;

export type SeoEventName = (typeof SEO_EVENTS)[keyof typeof SEO_EVENTS];

// ---------------------------------------------------------------------------
// SEO Pricing
// ---------------------------------------------------------------------------

export const SEO_PRICING: Record<string, string> = {
   "seo.analyzed": "0.001000",
   "seo.indexed": "0.000100",
};

// ---------------------------------------------------------------------------
// seo.analyzed
// ---------------------------------------------------------------------------

export const seoAnalyzedEventSchema = z.object({
   contentId: z.uuid(),
   score: z.number().min(0).max(100),
   keyword: z.string().optional(),
   keywordDensity: z.number().min(0).max(100).optional(),
   readabilityScore: z.number().min(0).max(100).optional(),
   issues: z
      .array(
         z.object({
            rule: z.string(),
            severity: z.enum(["error", "warning", "info"]),
            message: z.string(),
         }),
      )
      .optional(),
});
export type SeoAnalyzedEvent = z.infer<typeof seoAnalyzedEventSchema>;

export function emitSeoAnalyzed(
   emit: EmitFn,
   ctx: { organizationId: string; userId?: string },
   properties: SeoAnalyzedEvent,
) {
   return emit({
      ...ctx,
      eventName: SEO_EVENTS["seo.analyzed"],
      eventCategory: EVENT_CATEGORIES.seo,
      properties,
   });
}

// ---------------------------------------------------------------------------
// seo.indexed
// ---------------------------------------------------------------------------

export const seoIndexedEventSchema = z.object({
   contentId: z.uuid(),
   url: z.url(),
   indexed: z.boolean(),
   searchEngine: z.string().optional(),
});
export type SeoIndexedEvent = z.infer<typeof seoIndexedEventSchema>;

export function emitSeoIndexed(
   emit: EmitFn,
   ctx: { organizationId: string; userId?: string },
   properties: SeoIndexedEvent,
) {
   return emit({
      ...ctx,
      eventName: SEO_EVENTS["seo.indexed"],
      eventCategory: EVENT_CATEGORIES.seo,
      properties,
   });
}
