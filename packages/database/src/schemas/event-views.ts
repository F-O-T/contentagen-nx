import { sql } from "drizzle-orm";
import {
   bigint,
   date,
   decimal,
   integer,
   pgMaterializedView,
   text,
   uuid,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// daily_usage_by_event
// ---------------------------------------------------------------------------

export const dailyUsageByEvent = pgMaterializedView("daily_usage_by_event", {
   organizationId: uuid("organization_id").notNull(),
   eventName: text("event_name").notNull(),
   eventCategory: text("event_category").notNull(),
   date: date("date").notNull(),
   eventCount: integer("event_count").notNull(),
   totalCost: decimal("total_cost", { precision: 10, scale: 6 }).notNull(),
}).as(sql`
	SELECT
		organization_id,
		event_name,
		event_category,
		DATE(timestamp) AS date,
		COUNT(*)::int AS event_count,
		COALESCE(SUM(price_per_event::numeric), 0) AS total_cost
	FROM events
	WHERE is_billable = true
	GROUP BY organization_id, event_name, event_category, DATE(timestamp)
`);

// ---------------------------------------------------------------------------
// current_month_usage_by_event
// ---------------------------------------------------------------------------

export const currentMonthUsageByEvent = pgMaterializedView(
   "current_month_usage_by_event",
   {
      organizationId: uuid("organization_id").notNull(),
      eventName: text("event_name").notNull(),
      eventCategory: text("event_category").notNull(),
      eventCount: integer("event_count").notNull(),
      monthToDateCost: decimal("month_to_date_cost", {
         precision: 10,
         scale: 6,
      }).notNull(),
   },
).as(sql`
	SELECT
		organization_id,
		event_name,
		event_category,
		COUNT(*)::int AS event_count,
		COALESCE(SUM(price_per_event::numeric), 0) AS month_to_date_cost
	FROM events
	WHERE timestamp >= DATE_TRUNC('month', CURRENT_DATE)
		AND is_billable = true
	GROUP BY organization_id, event_name, event_category
`);

// ---------------------------------------------------------------------------
// current_month_usage_by_category
// ---------------------------------------------------------------------------

export const currentMonthUsageByCategory = pgMaterializedView(
   "current_month_usage_by_category",
   {
      organizationId: uuid("organization_id").notNull(),
      eventCategory: text("event_category").notNull(),
      eventCount: integer("event_count").notNull(),
      monthToDateCost: decimal("month_to_date_cost", {
         precision: 10,
         scale: 6,
      }).notNull(),
      projectedCost: decimal("projected_cost", {
         precision: 10,
         scale: 6,
      }).notNull(),
   },
).as(sql`
	SELECT
		organization_id,
		event_category,
		COUNT(*)::int AS event_count,
		COALESCE(SUM(price_per_event::numeric), 0) AS month_to_date_cost,
		CASE
			WHEN EXTRACT(DAY FROM CURRENT_DATE) > 0 THEN
				(COALESCE(SUM(price_per_event::numeric), 0) / EXTRACT(DAY FROM CURRENT_DATE)) *
				EXTRACT(DAY FROM DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')
			ELSE 0
		END AS projected_cost
	FROM events
	WHERE timestamp >= DATE_TRUNC('month', CURRENT_DATE)
		AND is_billable = true
	GROUP BY organization_id, event_category
`);

// ---------------------------------------------------------------------------
// daily_content_analytics
// ---------------------------------------------------------------------------

export const dailyContentAnalytics = pgMaterializedView(
   "daily_content_analytics",
   {
      organizationId: uuid("organization_id").notNull(),
      contentId: text("content_id"),
      date: date("date").notNull(),
      views: integer("views").notNull(),
      uniqueVisitors: integer("unique_visitors").notNull(),
      avgTimeSpentSeconds: decimal("avg_time_spent_seconds", {
         precision: 10,
         scale: 2,
      }),
      ctaClicks: integer("cta_clicks").notNull(),
      scrollCompletions: integer("scroll_completions").notNull(),
      ctaConversions: integer("cta_conversions").notNull(),
   },
).as(sql`
	SELECT
		organization_id,
		properties->>'contentId' AS content_id,
		DATE(timestamp) AS date,
		COUNT(*) FILTER (WHERE event_name = 'content.page.view')::int AS views,
		COUNT(DISTINCT CASE WHEN event_name = 'content.page.view' THEN properties->>'visitorId' END)::int AS unique_visitors,
		AVG((properties->>'durationSeconds')::numeric) FILTER (WHERE event_name = 'content.time.spent') AS avg_time_spent_seconds,
		COUNT(*) FILTER (WHERE event_name = 'content.cta.click')::int AS cta_clicks,
		COUNT(*) FILTER (WHERE event_name = 'content.scroll.milestone' AND properties->>'depth' = '100')::int AS scroll_completions,
		COUNT(*) FILTER (WHERE event_name = 'form.conversion')::int AS cta_conversions
	FROM events
	WHERE event_category IN ('content', 'form')
		AND timestamp >= CURRENT_DATE - INTERVAL '90 days'
	GROUP BY organization_id, content_id, DATE(timestamp)
`);

// ---------------------------------------------------------------------------
// content_traffic_sources
// ---------------------------------------------------------------------------

export const contentTrafficSources = pgMaterializedView(
   "content_traffic_sources",
   {
      organizationId: uuid("organization_id").notNull(),
      contentId: text("content_id"),
      source: text("source").notNull(),
      medium: text("medium"),
      views: integer("views").notNull(),
      uniqueVisitors: integer("unique_visitors").notNull(),
   },
).as(sql`
	SELECT
		organization_id,
		properties->>'contentId' AS content_id,
		COALESCE(properties->>'referrerSource', 'direct') AS source,
		properties->>'referrerMedium' AS medium,
		COUNT(*)::int AS views,
		COUNT(DISTINCT properties->>'visitorId')::int AS unique_visitors
	FROM events
	WHERE event_name = 'content.page.view'
		AND timestamp >= CURRENT_DATE - INTERVAL '90 days'
	GROUP BY organization_id, content_id, source, medium
`);

// ---------------------------------------------------------------------------
// monthly_sdk_usage
// ---------------------------------------------------------------------------

export const monthlySdkUsage = pgMaterializedView("monthly_sdk_usage", {
   organizationId: uuid("organization_id").notNull(),
   month: date("month").notNull(),
   authorRequests: integer("author_requests").notNull(),
   listRequests: integer("list_requests").notNull(),
   contentRequests: integer("content_requests").notNull(),
   imageRequests: integer("image_requests").notNull(),
   totalRequests: integer("total_requests").notNull(),
   errors: integer("errors").notNull(),
}).as(sql`
	SELECT
		organization_id,
		DATE_TRUNC('month', timestamp)::date AS month,
		COUNT(*) FILTER (WHERE event_name = 'sdk.author.fetched')::int AS author_requests,
		COUNT(*) FILTER (WHERE event_name = 'sdk.content.listed')::int AS list_requests,
		COUNT(*) FILTER (WHERE event_name = 'sdk.content.fetched')::int AS content_requests,
		COUNT(*) FILTER (WHERE event_name = 'sdk.image.fetched')::int AS image_requests,
		COUNT(*)::int AS total_requests,
		COUNT(*) FILTER (WHERE event_name IN ('sdk.auth.failed', 'sdk.error'))::int AS errors
	FROM events
	WHERE event_category = 'sdk'
	GROUP BY organization_id, DATE_TRUNC('month', timestamp)
`);

// ---------------------------------------------------------------------------
// monthly_ai_usage
// ---------------------------------------------------------------------------

export const monthlyAiUsage = pgMaterializedView("monthly_ai_usage", {
   organizationId: uuid("organization_id").notNull(),
   month: date("month").notNull(),
   completions: integer("completions").notNull(),
   chatMessages: integer("chat_messages").notNull(),
   agentActions: integer("agent_actions").notNull(),
   totalTokens: integer("total_tokens"),
   promptTokens: integer("prompt_tokens"),
   completionTokens: integer("completion_tokens"),
   avgLatencyMs: decimal("avg_latency_ms", { precision: 10, scale: 2 }),
}).as(sql`
	SELECT
		organization_id,
		DATE_TRUNC('month', timestamp)::date AS month,
		COUNT(*) FILTER (WHERE event_name = 'ai.completion')::int AS completions,
		COUNT(*) FILTER (WHERE event_name = 'ai.chat_message')::int AS chat_messages,
		COUNT(*) FILTER (WHERE event_name = 'ai.agent_action')::int AS agent_actions,
		SUM((properties->>'totalTokens')::int) AS total_tokens,
		SUM((properties->>'promptTokens')::int) AS prompt_tokens,
		SUM((properties->>'completionTokens')::int) AS completion_tokens,
		AVG((properties->>'latencyMs')::numeric) AS avg_latency_ms
	FROM events
	WHERE event_category = 'ai'
	GROUP BY organization_id, DATE_TRUNC('month', timestamp)
`);

// ---------------------------------------------------------------------------
// daily_event_counts
// ---------------------------------------------------------------------------

export const dailyEventCounts = pgMaterializedView("daily_event_counts", {
   organizationId: uuid("organization_id").notNull(),
   eventName: text("event_name").notNull(),
   eventCategory: text("event_category").notNull(),
   date: date("date").notNull(),
   eventCount: integer("event_count").notNull(),
   uniqueUsers: integer("unique_users").notNull(),
}).as(sql`
	SELECT
		organization_id,
		event_name,
		event_category,
		DATE(timestamp) AS date,
		COUNT(*)::int AS event_count,
		COUNT(DISTINCT user_id)::int AS unique_users
	FROM events
	WHERE timestamp >= CURRENT_DATE - INTERVAL '90 days'
	GROUP BY organization_id, event_name, event_category, DATE(timestamp)
`);

// ---------------------------------------------------------------------------
// experiment_daily_stats
// ---------------------------------------------------------------------------

export const experimentDailyStats = pgMaterializedView(
   "experiment_daily_stats",
   {
      organizationId: uuid("organization_id").notNull(),
      experimentId: uuid("experiment_id").notNull(),
      variantId: text("variant_id").notNull(),
      targetType: text("target_type").notNull(),
      targetId: uuid("target_id"),
      date: date("date").notNull(),
      impressions: integer("impressions").notNull(),
      conversions: integer("conversions").notNull(),
   },
).as(sql`
   SELECT
      organization_id,
      (properties->>'experimentId')::uuid AS experiment_id,
      properties->>'variantId' AS variant_id,
      COALESCE(properties->>'targetType', 'content') AS target_type,
      COALESCE(
         (properties->>'targetId')::uuid,
         (properties->>'contentId')::uuid
      ) AS target_id,
      DATE(timestamp) AS date,
      COUNT(*) FILTER (WHERE event_name = 'experiment.started')::int AS impressions,
      COUNT(*) FILTER (WHERE event_name = 'experiment.conversion')::int AS conversions
   FROM events
   WHERE event_category = 'experiment'
      AND timestamp >= CURRENT_DATE - INTERVAL '90 days'
      AND properties->>'experimentId' IS NOT NULL
      AND properties->>'variantId' IS NOT NULL
   GROUP BY organization_id, experiment_id, variant_id, target_type, target_id, DATE(timestamp)
`);

// ---------------------------------------------------------------------------
// current_month_storage_cost
// ---------------------------------------------------------------------------

export const currentMonthStorageCost = pgMaterializedView(
   "current_month_storage_cost",
   {
      organizationId: uuid("organization_id").notNull(),
      currentBytes: bigint("current_bytes", { mode: "bigint" }).notNull(),
      monthToDateCost: decimal("month_to_date_cost", {
         precision: 10,
         scale: 6,
      }).notNull(),
      projectedCost: decimal("projected_cost", {
         precision: 10,
         scale: 6,
      }).notNull(),
   },
).as(sql`
   SELECT
      organization_id,
      COALESCE(SUM(size), 0)::bigint AS current_bytes,
      COALESCE(SUM(
         (size / 1073741824.0) *
         GREATEST(
            EXTRACT(EPOCH FROM (
               NOW() - GREATEST(created_at, DATE_TRUNC('month', CURRENT_DATE))
            )) / 86400.0, 0
         ) /
         EXTRACT(DAY FROM (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day'))
         * 1.50
      ), 0) AS month_to_date_cost,
      COALESCE(SUM(size / 1073741824.0) * 1.50, 0) AS projected_cost
   FROM assets
   GROUP BY organization_id
`);
