/**
 * Content Analytics Query Functions for PostHog
 *
 * These functions query PostHog for blog post analytics using HogQL.
 * They provide aggregated metrics for content performance, engagement,
 * traffic sources, and conversion tracking.
 */

import { env } from "@packages/environment/server";
import type {
   ContentAnalyticsDaily,
   EngagementFunnel,
   TopContentItem,
   TrafficSource,
   TrafficSourceStats,
} from "../sdk/types";

// =============================================================================
// Query Parameters
// =============================================================================

export interface ContentAnalyticsQueryParams {
   organizationId: string;
   contentId?: string;
   startDate: Date;
   endDate: Date;
   granularity?: "daily" | "weekly" | "monthly";
}

export interface TopContentQueryParams {
   organizationId: string;
   sortBy: "views" | "engagement" | "conversions";
   limit: number;
   startDate: Date;
   endDate: Date;
}

export interface TrafficSourceQueryParams {
   organizationId: string;
   contentId?: string;
   startDate: Date;
   endDate: Date;
}

export interface EngagementFunnelQueryParams {
   organizationId: string;
   contentId: string;
   startDate: Date;
   endDate: Date;
}

// =============================================================================
// Response Types
// =============================================================================

export interface ContentAnalyticsStats {
   period: string;
   totalViews: number;
   uniqueVisitors: number;
   avgTimeSeconds: number;
   avgScrollDepth: number;
   bounceRate: number;
   ctaClicks: number;
   conversions: number;
   conversionRate: number;
   dailyStats?: ContentAnalyticsDaily[];
}

interface PostHogQueryResponse {
   results: unknown[][];
   columns: string[];
}

// =============================================================================
// Helper Functions
// =============================================================================

function formatDate(date: Date): string {
   const isoString = date.toISOString().split("T")[0];
   return isoString ?? "";
}

function getGranularityFunction(granularity: string): string {
   switch (granularity) {
      case "weekly":
         return "toStartOfWeek";
      case "monthly":
         return "toStartOfMonth";
      default:
         return "toDate";
   }
}

async function executeHogQLQuery(query: string): Promise<PostHogQueryResponse> {
   const response = await fetch(
      `${env.POSTHOG_HOST}/api/projects/${env.POSTHOG_PROJECT_ID}/query/`,
      {
         method: "POST",
         headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${env.POSTHOG_PERSONAL_API_KEY}`,
         },
         body: JSON.stringify({
            query: {
               kind: "HogQLQuery",
               query,
            },
         }),
      },
   );

   if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
         `PostHog query failed: ${response.statusText} - ${errorText}`,
      );
   }

   return (await response.json()) as PostHogQueryResponse;
}

// =============================================================================
// Query Functions
// =============================================================================

/**
 * Query content analytics for a specific time period
 *
 * Queries the pre-computed content_analytics_daily materialized view for fast results.
 */
export async function queryContentAnalytics(
   params: ContentAnalyticsQueryParams,
): Promise<ContentAnalyticsStats> {
   const { organizationId, contentId, startDate, endDate, granularity } =
      params;
   const contentFilter = contentId ? `AND content_id = '${contentId}'` : "";

   // Query the materialized view for fast results
   const aggregateQuery = `
      SELECT
         sum(total_views) as total_views,
         sum(unique_visitors) as unique_visitors,
         avg(avg_time_seconds) as avg_time_seconds,
         avg(avg_scroll_depth) as avg_scroll_depth,
         sum(cta_clicks) as cta_clicks,
         sum(conversions) as conversions
      FROM content_analytics_daily
      WHERE organization_id = '${organizationId}'
        ${contentFilter}
        AND date >= toDate('${formatDate(startDate)}')
        AND date <= toDate('${formatDate(endDate)}')
   `;

   const data = await executeHogQLQuery(aggregateQuery);
   const row = data.results[0] || [];

   const totalViews = (row[0] as number) || 0;
   const uniqueVisitors = (row[1] as number) || 0;
   const avgTimeSeconds = (row[2] as number) || 0;
   const avgScrollDepth = (row[3] as number) || 0;
   const ctaClicks = (row[4] as number) || 0;
   const conversions = (row[5] as number) || 0;

   // Bounce rate is not available in the materialized view
   // It requires session-level data that is not pre-aggregated
   const bounceRate = 0;
   const conversionRate = totalViews > 0 ? (conversions / totalViews) * 100 : 0;

   // Get daily breakdown if requested
   let dailyStats: ContentAnalyticsDaily[] | undefined;
   if (granularity) {
      const granularityFn = getGranularityFunction(granularity);
      const dailyQuery = `
         SELECT
            ${granularityFn}(date) as period,
            sum(total_views) as total_views,
            sum(unique_visitors) as unique_visitors,
            avg(avg_time_seconds) as avg_time_seconds,
            avg(avg_scroll_depth) as avg_scroll_depth,
            sum(cta_clicks) as cta_clicks,
            sum(conversions) as conversions
         FROM content_analytics_daily
         WHERE organization_id = '${organizationId}'
           ${contentFilter}
           AND date >= toDate('${formatDate(startDate)}')
           AND date <= toDate('${formatDate(endDate)}')
         GROUP BY period
         ORDER BY period ASC
      `;

      const dailyData = await executeHogQLQuery(dailyQuery);

      dailyStats = dailyData.results.map((r) => ({
         date: r[0] as string,
         organizationId,
         contentId: contentId || "",
         totalViews: (r[1] as number) || 0,
         uniqueVisitors: (r[2] as number) || 0,
         avgTimeSeconds: (r[3] as number) || 0,
         avgScrollDepth: (r[4] as number) || 0,
         ctaClicks: (r[5] as number) || 0,
         conversions: (r[6] as number) || 0,
      }));
   }

   return {
      period: `${formatDate(startDate)} - ${formatDate(endDate)}`,
      totalViews,
      uniqueVisitors,
      avgTimeSeconds,
      avgScrollDepth,
      bounceRate,
      ctaClicks,
      conversions,
      conversionRate,
      dailyStats,
   };
}

/**
 * Query top performing content
 */
export async function queryTopContent(
   params: TopContentQueryParams,
): Promise<TopContentItem[]> {
   const { organizationId, sortBy, limit, startDate, endDate } = params;

   let orderBy: string;
   switch (sortBy) {
      case "engagement":
         orderBy =
            "(avg_scroll_depth * 0.4 + (avg_time_seconds / 300) * 0.6) DESC";
         break;
      case "conversions":
         orderBy = "conversions DESC";
         break;
      default:
         orderBy = "views DESC";
   }

   const query = `
		SELECT
			properties.content_id as content_id,
			any(properties.content_slug) as content_slug,
			any(properties.content_title) as content_title,
			any(properties.agent_id) as agent_id,
			countIf(event = 'blog_post_view') as views,
			uniqExactIf(properties.visitor_id, event = 'blog_post_view') as unique_visitors,
			avgIf(toFloatOrDefault(properties.active_time_ms), event = 'blog_post_time_spent') / 1000 as avg_time_seconds,
			avgIf(toFloatOrDefault(properties.max_scroll_depth), event = 'blog_post_time_spent') as avg_scroll_depth,
			countIf(event = 'blog_post_cta_conversion') as conversions

		FROM events
		WHERE
			event LIKE 'blog_post_%'
			AND properties.organization_id = '${organizationId}'
			AND timestamp >= '${formatDate(startDate)}'
			AND timestamp <= '${formatDate(endDate)}'
		GROUP BY content_id
		ORDER BY ${orderBy}
		LIMIT ${limit}
	`;

   const data = await executeHogQLQuery(query);

   return data.results.map((row) => {
      const views = (row[4] as number) || 0;
      const uniqueVisitors = (row[5] as number) || 0;
      const avgTimeSeconds = (row[6] as number) || 0;
      const avgScrollDepth = (row[7] as number) || 0;

      // Calculate engagement score (weighted combination of metrics)
      const scrollScore = Math.min(avgScrollDepth / 100, 1);
      const timeScore = Math.min(avgTimeSeconds / 300, 1); // 5 min = max score
      const engagementScore = scrollScore * 0.4 + timeScore * 0.6;

      return {
         contentId: row[0] as string,
         contentSlug: row[1] as string,
         contentTitle: row[2] as string,
         agentId: row[3] as string,
         views,
         uniqueVisitors,
         avgTimeSeconds,
         avgScrollDepth,
         engagementScore: Math.round(engagementScore * 100),
      };
   });
}

/**
 * Query traffic source breakdown
 *
 * Queries the pre-computed content_traffic_sources materialized view for fast results.
 * Note: Content-specific filtering is not supported with the materialized view.
 */
export async function queryTrafficSources(
   params: TrafficSourceQueryParams,
): Promise<TrafficSourceStats[]> {
   const { organizationId, startDate, endDate } = params;

   // Query the materialized view for fast results
   // Note: contentId filtering is not supported in the materialized view
   const query = `
      SELECT
         month,
         traffic_source,
         utm_source,
         utm_campaign,
         views,
         unique_visitors,
         conversions
      FROM content_traffic_sources
      WHERE organization_id = '${organizationId}'
        AND month >= toStartOfMonth(toDateTime('${startDate.toISOString()}'))
        AND month <= toStartOfMonth(toDateTime('${endDate.toISOString()}'))
      ORDER BY month DESC, views DESC
   `;

   const data = await executeHogQLQuery(query);

   return data.results.map((row) => ({
      month: row[0] as string,
      organizationId,
      trafficSource: (row[1] as TrafficSource) || "direct",
      utmSource: (row[2] as string) || undefined,
      utmCampaign: (row[3] as string) || undefined,
      views: (row[4] as number) || 0,
      uniqueVisitors: (row[5] as number) || 0,
      conversions: (row[6] as number) || 0,
   }));
}

/**
 * Query engagement funnel for specific content
 */
export async function queryEngagementFunnel(
   params: EngagementFunnelQueryParams,
): Promise<EngagementFunnel> {
   const { organizationId, contentId, startDate, endDate } = params;

   const query = `
		SELECT
			-- Total views
			countIf(event = 'blog_post_view') as total_views,

			-- Scroll milestones
			countIf(event = 'blog_post_scroll' AND toInt64OrNull(properties.scroll_depth) >= 25) as scroll_25,
			countIf(event = 'blog_post_scroll' AND toInt64OrNull(properties.scroll_depth) >= 50) as scroll_50,
			countIf(event = 'blog_post_scroll' AND toInt64OrNull(properties.scroll_depth) >= 75) as scroll_75,
			countIf(event = 'blog_post_scroll' AND toInt64OrNull(properties.scroll_depth) >= 100) as scroll_100,

			-- Time metrics
			avgIf(toFloatOrDefault(properties.active_time_ms), event = 'blog_post_time_spent') as avg_active_time_ms,
			avgIf(toFloatOrDefault(properties.total_time_ms), event = 'blog_post_time_spent') as avg_total_time_ms,

			-- Time distribution
			countIf(event = 'blog_post_time_spent' AND toFloatOrDefault(properties.total_time_ms) < 30000) as under_30s,
			countIf(event = 'blog_post_time_spent' AND toFloatOrDefault(properties.total_time_ms) >= 30000 AND toFloatOrDefault(properties.total_time_ms) < 60000) as under_1m,
			countIf(event = 'blog_post_time_spent' AND toFloatOrDefault(properties.total_time_ms) >= 60000 AND toFloatOrDefault(properties.total_time_ms) < 120000) as under_2m,
			countIf(event = 'blog_post_time_spent' AND toFloatOrDefault(properties.total_time_ms) >= 120000 AND toFloatOrDefault(properties.total_time_ms) < 300000) as under_5m,
			countIf(event = 'blog_post_time_spent' AND toFloatOrDefault(properties.total_time_ms) >= 300000) as over_5m

		FROM events
		WHERE
			event LIKE 'blog_post_%'
			AND properties.organization_id = '${organizationId}'
			AND properties.content_id = '${contentId}'
			AND timestamp >= '${formatDate(startDate)}'
			AND timestamp <= '${formatDate(endDate)}'
	`;

   const data = await executeHogQLQuery(query);
   const row = data.results[0] || [];

   return {
      contentId,
      totalViews: (row[0] as number) || 0,
      scroll25: (row[1] as number) || 0,
      scroll50: (row[2] as number) || 0,
      scroll75: (row[3] as number) || 0,
      scroll100: (row[4] as number) || 0,
      avgActiveTimeMs: (row[5] as number) || 0,
      avgTotalTimeMs: (row[6] as number) || 0,
      timeDistribution: {
         under30s: (row[7] as number) || 0,
         under1m: (row[8] as number) || 0,
         under2m: (row[9] as number) || 0,
         under5m: (row[10] as number) || 0,
         over5m: (row[11] as number) || 0,
      },
   };
}
