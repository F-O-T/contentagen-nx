# Internal Analytics Query Engine

**Date:** 2026-02-09
**Status:** Design

## Goal

Replace PostHog's querying/visualization role with an internal analytics engine. Events are already stored in PostgreSQL via `emitEvent()` — we need materialized views optimized for analytics (not just billing) and oRPC procedures to query them.

PostHog stays as a secondary sink in `emitEvent()` for now. It can be removed later.

## Architecture

```
events table (already populated by emitEvent)
    ↓ hourly REFRESH CONCURRENTLY (worker cron)
4 new analytics materialized views (Drizzle pgMaterializedView)
    ↓ db.select().from(view).where(...)
oRPC analytics router (new)
    ↓
dashboards/insights UI (existing, rewired to call internal procedures)
```

**Key patterns:**
- **Drizzle `pgMaterializedView`** for schema definitions (same pattern as existing billing views in `event-views.ts`)
- **`db.refreshMaterializedView(view).concurrently()`** called from the worker's hourly cron
- **`db.select().from(view).where(...)`** for type-safe queries in oRPC procedures
- No raw SQL needed — Drizzle handles everything
- Fixed time presets (7d, 30d, 90d, this_month, last_month) instead of arbitrary ranges
- Breakdowns via JSONB property extraction in the view definitions

---

## New Materialized Views (Drizzle Schema)

All views defined in `packages/database/src/schemas/event-views.ts` alongside existing billing views, using `pgMaterializedView` from `drizzle-orm/pg-core`.

### 1. `daily_event_counts`

Core trends view — all events (not just billable), with extracted breakdown dimensions.

```typescript
export const dailyEventCounts = pgMaterializedView("daily_event_counts", {
   organizationId: uuid("organization_id").notNull(),
   eventName: text("event_name").notNull(),
   eventCategory: text("event_category").notNull(),
   date: date("date").notNull(),
   contentId: uuid("content_id"),
   trafficSource: text("traffic_source"),
   deviceType: text("device_type"),
   country: text("country"),
   eventCount: integer("event_count").notNull(),
}).as(sql`
   SELECT
      organization_id,
      event_name,
      event_category,
      DATE(timestamp) AS date,
      (properties->>'contentId')::uuid AS content_id,
      properties->>'trafficSource' AS traffic_source,
      properties->>'deviceType' AS device_type,
      properties->>'country' AS country,
      COUNT(*)::int AS event_count
   FROM events
   WHERE timestamp >= CURRENT_DATE - INTERVAL '90 days'
   GROUP BY
      organization_id, event_name, event_category,
      DATE(timestamp), content_id, traffic_source, device_type, country
`);
```

### 2. `daily_content_metrics`

Content-specific aggregations per content item per day.

```typescript
export const dailyContentMetrics = pgMaterializedView("daily_content_metrics", {
   organizationId: uuid("organization_id").notNull(),
   contentId: uuid("content_id"),
   date: date("date").notNull(),
   views: integer("views").notNull(),
   uniqueVisitors: integer("unique_visitors").notNull(),
   avgTimeSpent: decimal("avg_time_spent", { precision: 10, scale: 2 }),
   ctaClicks: integer("cta_clicks").notNull(),
   readCompletions: integer("read_completions").notNull(),
}).as(sql`
   SELECT
      organization_id,
      (properties->>'contentId')::uuid AS content_id,
      DATE(timestamp) AS date,
      COUNT(*) FILTER (WHERE event_name = 'content.page.view')::int AS views,
      COUNT(DISTINCT properties->>'visitorId')
         FILTER (WHERE event_name = 'content.page.view')::int AS unique_visitors,
      AVG((properties->>'durationSeconds')::numeric)
         FILTER (WHERE event_name = 'content.time.spent') AS avg_time_spent,
      COUNT(*) FILTER (WHERE event_name = 'content.cta.click')::int AS cta_clicks,
      COUNT(*) FILTER (WHERE event_name = 'content.scroll.milestone'
         AND properties->>'depth' = '100')::int AS read_completions
   FROM events
   WHERE event_category = 'content'
      AND timestamp >= CURRENT_DATE - INTERVAL '90 days'
   GROUP BY organization_id, content_id, DATE(timestamp)
`);
```

### 3. `daily_ai_metrics`

AI usage aggregations with token and latency breakdowns.

```typescript
export const dailyAiMetrics = pgMaterializedView("daily_ai_metrics", {
   organizationId: uuid("organization_id").notNull(),
   eventName: text("event_name").notNull(),
   date: date("date").notNull(),
   eventCount: integer("event_count").notNull(),
   totalTokens: integer("total_tokens"),
   avgLatencyMs: decimal("avg_latency_ms", { precision: 10, scale: 2 }),
   promptTokens: integer("prompt_tokens"),
   completionTokens: integer("completion_tokens"),
}).as(sql`
   SELECT
      organization_id,
      event_name,
      DATE(timestamp) AS date,
      COUNT(*)::int AS event_count,
      SUM((properties->>'totalTokens')::int) AS total_tokens,
      AVG((properties->>'latencyMs')::numeric) AS avg_latency_ms,
      SUM((properties->>'promptTokens')::int) AS prompt_tokens,
      SUM((properties->>'completionTokens')::int) AS completion_tokens
   FROM events
   WHERE event_category = 'ai'
      AND timestamp >= CURRENT_DATE - INTERVAL '90 days'
   GROUP BY organization_id, event_name, DATE(timestamp)
`);
```

### 4. `daily_form_metrics`

Form funnel metrics per form per day.

```typescript
export const dailyFormMetrics = pgMaterializedView("daily_form_metrics", {
   organizationId: uuid("organization_id").notNull(),
   formId: uuid("form_id"),
   date: date("date").notNull(),
   impressions: integer("impressions").notNull(),
   submissions: integer("submissions").notNull(),
   conversions: integer("conversions").notNull(),
   fieldErrors: integer("field_errors").notNull(),
}).as(sql`
   SELECT
      organization_id,
      (properties->>'formId')::uuid AS form_id,
      DATE(timestamp) AS date,
      COUNT(*) FILTER (WHERE event_name = 'form.impression')::int AS impressions,
      COUNT(*) FILTER (WHERE event_name = 'form.submitted')::int AS submissions,
      COUNT(*) FILTER (WHERE event_name = 'form.conversion')::int AS conversions,
      COUNT(*) FILTER (WHERE event_name = 'form.field_error')::int AS field_errors
   FROM events
   WHERE event_category = 'form'
      AND timestamp >= CURRENT_DATE - INTERVAL '90 days'
   GROUP BY organization_id, form_id, DATE(timestamp)
`);
```

---

## Worker: Materialized View Refresh

The worker already runs an hourly cron that calls `refreshUsageViews()`. We add the 4 new analytics views to that same function.

### Current flow (unchanged)

```
apps/worker/src/index.ts → startScheduler(db, redis)
  → scheduler.ts → cron "0 * * * *"
    → jobs/refresh-views.ts → refreshUsageViews(db)
    → jobs/reconcile-credits.ts → reconcileCreditCounters(db, redis)
```

### Updated `packages/events/src/refresh-views.ts`

```typescript
import type { DatabaseInstance } from "@packages/database/client";
import {
   // Existing billing views
   currentMonthUsageByCategory,
   currentMonthUsageByEvent,
   dailyUsageByEvent,
   // New analytics views
   dailyEventCounts,
   dailyContentMetrics,
   dailyAiMetrics,
   dailyFormMetrics,
} from "@packages/database/schema";

export async function refreshUsageViews(db: DatabaseInstance): Promise<void> {
   const startTime = Date.now();

   try {
      await Promise.all([
         // Billing views
         db.refreshMaterializedView(dailyUsageByEvent).concurrently(),
         db.refreshMaterializedView(currentMonthUsageByEvent).concurrently(),
         db.refreshMaterializedView(currentMonthUsageByCategory).concurrently(),
         // Analytics views
         db.refreshMaterializedView(dailyEventCounts).concurrently(),
         db.refreshMaterializedView(dailyContentMetrics).concurrently(),
         db.refreshMaterializedView(dailyAiMetrics).concurrently(),
         db.refreshMaterializedView(dailyFormMetrics).concurrently(),
      ]);

      const duration = Date.now() - startTime;
      console.log(`[Events] Refreshed materialized views in ${duration}ms`);
   } catch (error) {
      console.error("[Events] Failed to refresh materialized views:", error);
      throw error;
   }
}
```

No changes needed in `apps/worker/` — it already calls `refreshUsageViews(db)` which will pick up the new views automatically.

---

## Drizzle Query Patterns (oRPC Router)

All queries use Drizzle's type-safe `db.select().from(view).where(...)` — no raw SQL in the router layer.

### Example: Content Metrics Query

```typescript
import { and, eq, gte, lte, sum, avg, desc } from "drizzle-orm";
import { dailyContentMetrics } from "@packages/database/schema";

// Get daily content metrics for a specific content item
const rows = await db
   .select()
   .from(dailyContentMetrics)
   .where(
      and(
         eq(dailyContentMetrics.organizationId, organizationId),
         eq(dailyContentMetrics.contentId, contentId),
         gte(dailyContentMetrics.date, range.start.toISOString()),
         lte(dailyContentMetrics.date, range.end.toISOString()),
      ),
   )
   .orderBy(dailyContentMetrics.date);
```

### Example: Top Content Query

```typescript
// Top content by views in a date range
const rows = await db
   .select({
      contentId: dailyContentMetrics.contentId,
      totalViews: sum(dailyContentMetrics.views).as("total_views"),
      totalUniqueVisitors: sum(dailyContentMetrics.uniqueVisitors).as("total_unique_visitors"),
      avgTimeSpent: avg(dailyContentMetrics.avgTimeSpent).as("avg_time_spent"),
      totalCtaClicks: sum(dailyContentMetrics.ctaClicks).as("total_cta_clicks"),
   })
   .from(dailyContentMetrics)
   .where(
      and(
         eq(dailyContentMetrics.organizationId, organizationId),
         gte(dailyContentMetrics.date, range.start.toISOString()),
         lte(dailyContentMetrics.date, range.end.toISOString()),
      ),
   )
   .groupBy(dailyContentMetrics.contentId)
   .orderBy(desc(sql`total_views`))
   .limit(limit);
```

### Example: Trends with Breakdown

```typescript
import { dailyEventCounts } from "@packages/database/schema";

// Event trends with traffic source breakdown
const rows = await db
   .select({
      date: dailyEventCounts.date,
      trafficSource: dailyEventCounts.trafficSource,
      eventCount: sum(dailyEventCounts.eventCount).as("event_count"),
   })
   .from(dailyEventCounts)
   .where(
      and(
         eq(dailyEventCounts.organizationId, organizationId),
         eq(dailyEventCounts.eventName, "content.page.view"),
         gte(dailyEventCounts.date, range.start.toISOString()),
         lte(dailyEventCounts.date, range.end.toISOString()),
      ),
   )
   .groupBy(dailyEventCounts.date, dailyEventCounts.trafficSource)
   .orderBy(dailyEventCounts.date);
```

---

## oRPC Analytics Router

New file: `apps/web/src/integrations/orpc/router/analytics.ts`

### Types

```typescript
const analyticsPresetSchema = z.enum(["7d", "30d", "90d", "this_month", "last_month"]);
type AnalyticsPreset = z.infer<typeof analyticsPresetSchema>;

const breakdownDimensionSchema = z.enum(["traffic_source", "device_type", "country", "content_id"]);
type BreakdownDimension = z.infer<typeof breakdownDimensionSchema>;
```

### Preset → Date Range Mapping

```typescript
function presetToDateRange(preset: AnalyticsPreset): { start: Date; end: Date } {
   const now = new Date();
   const end = now;
   switch (preset) {
      case "7d":  return { start: subDays(now, 7), end };
      case "30d": return { start: subDays(now, 30), end };
      case "90d": return { start: subDays(now, 90), end };
      case "this_month": return { start: startOfMonth(now), end };
      case "last_month": return {
         start: startOfMonth(subMonths(now, 1)),
         end: endOfMonth(subMonths(now, 1)),
      };
   }
}
```

### Procedures

| Procedure | View Used | Input | Returns |
|-----------|-----------|-------|---------|
| `trends` | `dailyEventCounts` | `{ eventName?, eventCategory?, preset, breakdownBy? }` | `{ date, count, dimension? }[]` |
| `contentMetrics` | `dailyContentMetrics` | `{ contentId?, preset }` | `{ date, views, uniqueVisitors, avgTimeSpent, ctaClicks, readCompletions }[]` |
| `aiMetrics` | `dailyAiMetrics` | `{ preset }` | `{ date, eventName, eventCount, totalTokens, avgLatencyMs }[]` |
| `formMetrics` | `dailyFormMetrics` | `{ formId?, preset }` | `{ date, impressions, submissions, conversions, fieldErrors }[]` |
| `topContent` | `dailyContentMetrics` | `{ preset, limit?, orderBy? }` | `{ contentId, totalViews, uniqueVisitors, avgTimeSpent, ctaClicks }[]` |
| `overview` | all views | `{ preset }` | `{ totalViews, totalUniqueVisitors, totalAiEvents, totalFormSubmissions, topContent[] }` |

All procedures use `protectedProcedure` and filter by `organizationId` from context.

---

## Database Migration

Drizzle's `db:push` handles creating `pgMaterializedView` definitions. However, indexes on materialized views require a custom SQL migration:

```sql
-- Indexes for analytics views (run after db:push creates the views)

CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_event_counts_pk
   ON daily_event_counts (organization_id, event_name, date, content_id, traffic_source, device_type, country);
CREATE INDEX IF NOT EXISTS idx_daily_event_counts_org_date
   ON daily_event_counts (organization_id, date);

CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_content_metrics_pk
   ON daily_content_metrics (organization_id, content_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_content_metrics_org_date
   ON daily_content_metrics (organization_id, date);

CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_ai_metrics_pk
   ON daily_ai_metrics (organization_id, event_name, date);

CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_form_metrics_pk
   ON daily_form_metrics (organization_id, form_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_form_metrics_org_date
   ON daily_form_metrics (organization_id, date);

-- Note: UNIQUE indexes are required for REFRESH MATERIALIZED VIEW CONCURRENTLY
-- Initial populate
REFRESH MATERIALIZED VIEW daily_event_counts;
REFRESH MATERIALIZED VIEW daily_content_metrics;
REFRESH MATERIALIZED VIEW daily_ai_metrics;
REFRESH MATERIALIZED VIEW daily_form_metrics;
```

---

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `packages/database/src/schemas/event-views.ts` | Edit | Add 4 Drizzle `pgMaterializedView` definitions |
| `packages/database/src/schema.ts` | N/A | Already exports `event-views.ts` |
| `packages/events/src/refresh-views.ts` | Edit | Import + refresh 4 new views in `refreshUsageViews()` |
| `apps/web/src/integrations/orpc/router/analytics.ts` | Create | New analytics router (6 procedures using `db.select().from(view)`) |
| `apps/web/src/integrations/orpc/router/index.ts` | Edit | Register analytics router |
| SQL migration | Create | Indexes (including UNIQUE for CONCURRENTLY) + initial populate |

No changes needed in `apps/worker/` — it already calls `refreshUsageViews(db)`.

---

## What This Does NOT Include

- **PostHog removal** — it stays as secondary sink for now
- **UI changes** — the dashboards/insights pages need rewiring to call the new procedures, but that's a separate effort
- **Funnel analysis** — out of scope per design decision
- **Arbitrary date ranges** — fixed presets only
