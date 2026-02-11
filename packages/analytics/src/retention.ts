import type { DatabaseInstance } from "@packages/database/client";
import { AppError, propagateError } from "@packages/utils/errors";
import { sql } from "drizzle-orm";

import {
   type ResolvedDateRange,
   resolveDateRange,
   resolveDateRangeWithComparison,
} from "./date-ranges";
import type {
   RetentionCohort,
   RetentionConfig,
   RetentionResult,
} from "./types";

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────

const PERIOD_SECONDS: Record<RetentionConfig["period"], number> = {
   day: 86_400,
   week: 604_800,
   month: 2_592_000,
};

// ──────────────────────────────────────────────
// Raw row shape from the SQL query
// ──────────────────────────────────────────────

interface RetentionRow extends Record<string, unknown> {
   cohort_period: string;
   period_offset: number;
   retained: number;
}

// ──────────────────────────────────────────────
// Main Export
// ──────────────────────────────────────────────

/**
 * Executes a retention/cohort analysis query.
 *
 * Builds a CTE-based SQL query that:
 * 1. Groups users into cohorts by the period of their first start event
 * 2. Tracks return events across subsequent periods
 * 3. Computes retention counts and percentages per cohort/period
 *
 * Optionally runs the same query for a previous comparison period.
 */
export async function executeRetentionQuery(
   db: DatabaseInstance,
   organizationId: string,
   config: RetentionConfig,
): Promise<RetentionResult> {
   const periodSeconds = PERIOD_SECONDS[config.period];

   if (config.compare) {
      const { start, end, previous } = resolveDateRangeWithComparison(
         config.dateRange,
      );

      const [cohorts, comparisonCohorts] = await Promise.all([
         runRetentionQuery(
            db,
            organizationId,
            config,
            { start, end },
            periodSeconds,
         ),
         runRetentionQuery(db, organizationId, config, previous, periodSeconds),
      ]);

      return {
         cohorts,
         comparison: { cohorts: comparisonCohorts },
      };
   }

   const { start, end } = resolveDateRange(config.dateRange);
   const cohorts = await runRetentionQuery(
      db,
      organizationId,
      config,
      { start, end },
      periodSeconds,
   );

   return { cohorts };
}

// ──────────────────────────────────────────────
// Query Execution
// ──────────────────────────────────────────────

async function runRetentionQuery(
   db: DatabaseInstance,
   organizationId: string,
   config: RetentionConfig,
   range: ResolvedDateRange,
   periodSeconds: number,
): Promise<RetentionCohort[]> {
   const { startEvent, returnEvent, period, totalPeriods } = config;

   // `period` is from a validated enum ("day" | "week" | "month") — safe for sql.raw()
   // `periodSeconds` is derived from that enum — safe as a literal
   const truncFn = sql.raw(`'${period}'`);
   const periodSecondsLiteral = sql.raw(String(periodSeconds));

   try {
      const result = await db.execute<RetentionRow>(sql`
         WITH cohorts AS (
            SELECT user_id, DATE_TRUNC(${truncFn}, MIN(timestamp)) AS cohort_period
            FROM events
            WHERE organization_id = ${organizationId}
              AND event_name = ${startEvent.event}
              AND timestamp >= ${range.start}
              AND timestamp < ${range.end}
            GROUP BY user_id
         ),
         activity AS (
            SELECT DISTINCT c.user_id, c.cohort_period,
               DATE_TRUNC(${truncFn}, e.timestamp) AS activity_period
            FROM cohorts c
            JOIN events e ON e.user_id = c.user_id
              AND e.event_name = ${returnEvent.event}
              AND e.organization_id = ${organizationId}
         ),
         retention AS (
            SELECT cohort_period,
               floor(EXTRACT(EPOCH FROM (activity_period - cohort_period)) / ${periodSecondsLiteral})::int AS period_offset,
               COUNT(DISTINCT user_id)::int AS retained
            FROM activity
            GROUP BY cohort_period, period_offset
            HAVING floor(EXTRACT(EPOCH FROM (activity_period - cohort_period)) / ${periodSecondsLiteral})::int >= 0
              AND floor(EXTRACT(EPOCH FROM (activity_period - cohort_period)) / ${periodSecondsLiteral})::int <= ${totalPeriods}
         )
         SELECT cohort_period, period_offset, retained
         FROM retention
         ORDER BY cohort_period, period_offset
      `);

      const rows = result.rows as RetentionRow[];
      return buildCohorts(rows, totalPeriods);
   } catch (error) {
      propagateError(error);
      throw AppError.database("Failed to execute retention query", {
         cause: error,
      });
   }
}

// ──────────────────────────────────────────────
// Post-processing
// ──────────────────────────────────────────────

function buildCohorts(
   rows: RetentionRow[],
   totalPeriods: number,
): RetentionCohort[] {
   // Group rows by cohort_period
   const cohortMap = new Map<string, Map<number, number>>();

   for (const row of rows) {
      const key = String(row.cohort_period);
      let periodMap = cohortMap.get(key);
      if (!periodMap) {
         periodMap = new Map();
         cohortMap.set(key, periodMap);
      }
      periodMap.set(Number(row.period_offset), Number(row.retained));
   }

   // Build sorted cohort array
   const sortedKeys = [...cohortMap.keys()].sort();

   return sortedKeys.map((cohortKey) => {
      const periodMap = cohortMap.get(cohortKey) as Map<number, number>;
      const cohortSize = periodMap.get(0) ?? 0;

      const retentionByPeriod = Array.from(
         { length: totalPeriods + 1 },
         (_, periodIndex) => {
            const retained = periodMap.get(periodIndex) ?? 0;
            const percentage =
               cohortSize > 0
                  ? Math.round((retained / cohortSize) * 10_000) / 100
                  : 0;

            return { period: periodIndex, retained, percentage };
         },
      );

      return {
         cohortLabel: formatCohortLabel(cohortKey),
         cohortSize,
         retentionByPeriod,
      };
   });
}

/**
 * Formats a cohort period timestamp into a date label (YYYY-MM-DD).
 */
function formatCohortLabel(value: string): string {
   const date = new Date(value);

   if (Number.isNaN(date.getTime())) {
      return value;
   }

   const year = date.getUTCFullYear();
   const month = String(date.getUTCMonth() + 1).padStart(2, "0");
   const day = String(date.getUTCDate()).padStart(2, "0");

   return `${year}-${month}-${day}`;
}
