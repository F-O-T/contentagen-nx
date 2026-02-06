import { z } from "zod";

// ---------------------------------------------------------------------------
// seo.analyzed
// ---------------------------------------------------------------------------

export const seoAnalyzedEventSchema = z.object({
   organizationId: z.string().uuid(),
   contentId: z.string().uuid(),
   userId: z.string().uuid().optional(),
   /** Overall SEO score (0-100) */
   score: z.number().min(0).max(100),
   keyword: z.string().optional(),
   /** Keyword density as a percentage */
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
   timestamp: z.string().datetime(),
});
export type SeoAnalyzedEvent = z.infer<typeof seoAnalyzedEventSchema>;

// ---------------------------------------------------------------------------
// seo.indexed
// ---------------------------------------------------------------------------

export const seoIndexedEventSchema = z.object({
   organizationId: z.string().uuid(),
   contentId: z.string().uuid(),
   url: z.string().url(),
   /** Whether the page was successfully indexed */
   indexed: z.boolean(),
   /** Search engine that indexed the page */
   searchEngine: z.string().optional(),
   timestamp: z.string().datetime(),
});
export type SeoIndexedEvent = z.infer<typeof seoIndexedEventSchema>;
