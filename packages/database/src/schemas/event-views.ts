import {
	decimal,
	integer,
	date,
	pgMaterializedView,
	text,
	uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

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
