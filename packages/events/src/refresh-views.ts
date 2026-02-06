import type { DatabaseInstance } from "@packages/database/client";
import { sql } from "drizzle-orm";

/**
 * SQL to create the materialized views (idempotent - uses IF NOT EXISTS).
 * Run once during setup/migration.
 */
export async function createUsageViews(db: DatabaseInstance): Promise<void> {
   // Create daily_usage_by_event
   await db.execute(sql`
		CREATE MATERIALIZED VIEW IF NOT EXISTS daily_usage_by_event AS
		SELECT
			organization_id,
			event_name,
			event_category,
			DATE(timestamp) AS date,
			COUNT(*) AS event_count,
			COALESCE(SUM(price_per_event::numeric), 0) AS total_cost
		FROM events
		WHERE is_billable = true
		GROUP BY organization_id, event_name, event_category, DATE(timestamp)
	`);

   // Create unique index for CONCURRENTLY refresh
   await db.execute(sql`
		CREATE UNIQUE INDEX IF NOT EXISTS daily_usage_by_event_uniq
		ON daily_usage_by_event (organization_id, event_name, date)
	`);

   // Create current_month_usage_by_event
   await db.execute(sql`
		CREATE MATERIALIZED VIEW IF NOT EXISTS current_month_usage_by_event AS
		SELECT
			organization_id,
			event_name,
			event_category,
			COUNT(*) AS event_count,
			COALESCE(SUM(price_per_event::numeric), 0) AS month_to_date_cost
		FROM events
		WHERE timestamp >= DATE_TRUNC('month', CURRENT_DATE)
			AND is_billable = true
		GROUP BY organization_id, event_name, event_category
	`);

   await db.execute(sql`
		CREATE UNIQUE INDEX IF NOT EXISTS current_month_usage_by_event_uniq
		ON current_month_usage_by_event (organization_id, event_name)
	`);

   // Create current_month_usage_by_category
   await db.execute(sql`
		CREATE MATERIALIZED VIEW IF NOT EXISTS current_month_usage_by_category AS
		SELECT
			organization_id,
			event_category,
			COUNT(*) AS event_count,
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

   await db.execute(sql`
		CREATE UNIQUE INDEX IF NOT EXISTS current_month_usage_by_category_uniq
		ON current_month_usage_by_category (organization_id, event_category)
	`);

   console.log("[Events] Materialized views created");
}

/**
 * Refresh all billing materialized views.
 * Uses CONCURRENTLY to avoid blocking reads.
 * Should be called hourly via a scheduled job.
 */
export async function refreshUsageViews(db: DatabaseInstance): Promise<void> {
   const startTime = Date.now();

   try {
      await Promise.all([
         db.execute(
            sql`REFRESH MATERIALIZED VIEW CONCURRENTLY daily_usage_by_event`,
         ),
         db.execute(
            sql`REFRESH MATERIALIZED VIEW CONCURRENTLY current_month_usage_by_event`,
         ),
         db.execute(
            sql`REFRESH MATERIALIZED VIEW CONCURRENTLY current_month_usage_by_category`,
         ),
      ]);

      const duration = Date.now() - startTime;
      console.log(`[Events] Refreshed materialized views in ${duration}ms`);
   } catch (error) {
      console.error("[Events] Failed to refresh materialized views:", error);
      throw error; // Let the caller (BullMQ) handle retries
   }
}
