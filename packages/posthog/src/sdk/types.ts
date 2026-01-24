/**
 * Blog Analytics Event Types for PostHog
 *
 * These types define the event schemas for blog post analytics tracking.
 * Used for type safety when capturing events from the client-side tracking script.
 */

// =============================================================================
// Event Names
// =============================================================================

export type BlogAnalyticsEvent =
   | "blog_post_view"
   | "blog_post_scroll"
   | "blog_post_section_view"
   | "blog_post_time_spent"
   | "blog_post_link_click"
   | "blog_post_cta_impression"
   | "blog_post_cta_click"
   | "blog_post_cta_conversion";

// =============================================================================
// Common Types
// =============================================================================

export type TrafficSource =
   | "organic"
   | "direct"
   | "referral"
   | "social"
   | "paid"
   | "email";

export type DeviceType = "desktop" | "tablet" | "mobile";

export type LinkType = "internal" | "external" | "anchor";

// =============================================================================
// Base Properties (shared across all blog analytics events)
// =============================================================================

export interface BlogAnalyticsBaseProps {
   content_id: string;
   content_slug: string;
   content_title: string;
   agent_id: string;
   organization_id: string;
   visitor_id: string;
   session_id: string;
   referrer: string;
   referrer_domain: string;
   traffic_source: TrafficSource;
   device_type: DeviceType;
   word_count: number;
   estimated_read_time: number;
   utm_source?: string;
   utm_medium?: string;
   utm_campaign?: string;
   utm_content?: string;
   utm_term?: string;
   page_url: string;
   page_path: string;
}

// =============================================================================
// Event-Specific Property Interfaces
// =============================================================================

/**
 * Properties for `blog_post_view` event
 * Captured when a blog post is first viewed
 */
export interface BlogPostViewProps extends BlogAnalyticsBaseProps {
   // All properties come from base
}

/**
 * Properties for `blog_post_scroll` event
 * Captured when scroll milestones are reached (25%, 50%, 75%, 100%)
 */
export interface BlogPostScrollProps extends BlogAnalyticsBaseProps {
   scroll_depth: 25 | 50 | 75 | 100;
   time_to_scroll_ms: number;
}

/**
 * Properties for `blog_post_section_view` event
 * Captured when a heading/section becomes visible
 */
export interface BlogPostSectionViewProps extends BlogAnalyticsBaseProps {
   section_id: string;
   section_title: string;
   section_tag: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
   time_to_section_ms: number;
   view_count: number;
}

/**
 * Properties for `blog_post_time_spent` event
 * Captured on page unload with final metrics
 */
export interface BlogPostTimeSpentProps extends BlogAnalyticsBaseProps {
   total_time_ms: number;
   active_time_ms: number;
   max_scroll_depth: number;
   sections_viewed_count: number;
   scroll_milestones_reached: number[];
}

/**
 * Properties for `blog_post_link_click` event
 * Captured when any link in the content is clicked
 */
export interface BlogPostLinkClickProps extends BlogAnalyticsBaseProps {
   link_url: string;
   link_text: string;
   link_type: LinkType;
   is_cta: boolean;
   time_on_page_ms: number;
}

/**
 * Properties for `blog_post_cta_impression` event
 * Captured when a CTA element becomes visible
 */
export interface BlogPostCtaImpressionProps extends BlogAnalyticsBaseProps {
   cta_id: string;
   cta_name: string;
   time_on_page_ms: number;
}

/**
 * Properties for `blog_post_cta_click` event
 * Captured when a CTA is clicked
 */
export interface BlogPostCtaClickProps extends BlogAnalyticsBaseProps {
   cta_id: string;
   cta_name: string;
   cta_url: string;
   time_on_page_ms: number;
}

/**
 * Properties for `blog_post_cta_conversion` event
 * Captured when a CTA conversion is tracked (usually server-side)
 */
export interface BlogPostCtaConversionProps extends BlogAnalyticsBaseProps {
   cta_id: string;
   cta_name: string;
   conversion_type: string;
   conversion_value?: number;
   conversion_currency?: string;
}

// =============================================================================
// Event Type Map
// =============================================================================

export interface BlogAnalyticsEventMap {
   blog_post_view: BlogPostViewProps;
   blog_post_scroll: BlogPostScrollProps;
   blog_post_section_view: BlogPostSectionViewProps;
   blog_post_time_spent: BlogPostTimeSpentProps;
   blog_post_link_click: BlogPostLinkClickProps;
   blog_post_cta_impression: BlogPostCtaImpressionProps;
   blog_post_cta_click: BlogPostCtaClickProps;
   blog_post_cta_conversion: BlogPostCtaConversionProps;
}

// =============================================================================
// Aggregated Analytics Types (for queries)
// =============================================================================

/**
 * Daily aggregated content analytics
 */
export interface ContentAnalyticsDaily {
   date: string;
   organizationId: string;
   contentId: string;
   totalViews: number;
   uniqueVisitors: number;
   avgTimeSeconds: number;
   avgScrollDepth: number;
   ctaClicks: number;
   conversions: number;
}

/**
 * Traffic source breakdown
 */
export interface TrafficSourceStats {
   month: string;
   organizationId: string;
   trafficSource: TrafficSource;
   utmSource?: string;
   utmCampaign?: string;
   views: number;
   uniqueVisitors: number;
   conversions: number;
}

/**
 * Content performance metrics
 */
export interface ContentPerformanceStats {
   contentId: string;
   contentSlug: string;
   contentTitle: string;
   agentId: string;
   totalViews: number;
   uniqueVisitors: number;
   avgTimeSeconds: number;
   avgScrollDepth: number;
   bounceRate: number;
   engagementScore: number;
   ctaClickRate: number;
   conversionRate: number;
}

/**
 * Engagement funnel metrics
 */
export interface EngagementFunnel {
   contentId: string;
   totalViews: number;
   scroll25: number;
   scroll50: number;
   scroll75: number;
   scroll100: number;
   avgActiveTimeMs: number;
   avgTotalTimeMs: number;
   timeDistribution: {
      under30s: number;
      under1m: number;
      under2m: number;
      under5m: number;
      over5m: number;
   };
}

/**
 * Top content item
 */
export interface TopContentItem {
   contentId: string;
   contentSlug: string;
   contentTitle: string;
   agentId: string;
   views: number;
   uniqueVisitors: number;
   avgTimeSeconds: number;
   avgScrollDepth: number;
   engagementScore: number;
}
