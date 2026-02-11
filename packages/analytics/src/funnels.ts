import type { DatabaseInstance } from "@packages/database/client";
import { AppError, propagateError } from "@packages/utils/errors";
import { sql } from "drizzle-orm";

import {
   type ResolvedDateRange,
   resolveDateRange,
   resolveDateRangeWithComparison,
} from "./date-ranges";
import type {
   Filter,
   FunnelStepResult,
   FunnelsConfig,
   FunnelsResult,
} from "./types";

// ──────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────

/**
 * Executes a funnel analysis query for the given organization and config.
 *
 * The query uses a CTE chain where each step finds the first occurrence
 * of the step's event per user, ensuring temporal ordering and respecting
 * the conversion window.
 */
export async function executeFunnelsQuery(
   db: DatabaseInstance,
   organizationId: string,
   config: FunnelsConfig,
): Promise<FunnelsResult> {
   const steps = buildFunnelSteps(config);

   if (config.compare) {
      const resolved = resolveDateRangeWithComparison(config.dateRange);

      const [currentCounts, previousCounts] = await Promise.all([
         runFunnelQuery(db, organizationId, config, resolved, steps),
         runFunnelQuery(db, organizationId, config, resolved.previous, steps),
      ]);

      const currentStepResults = buildStepResults(currentCounts, steps);
      const previousStepResults = buildStepResults(previousCounts, steps);

      const currentOverall = computeOverallConversion(currentCounts);
      const previousOverall = computeOverallConversion(previousCounts);

      return {
         steps: currentStepResults,
         overallConversion: currentOverall,
         comparison: {
            steps: previousStepResults,
            overallConversion: previousOverall,
            conversionChange: currentOverall - previousOverall,
         },
      };
   }

   const resolved = resolveDateRange(config.dateRange);
   const counts = await runFunnelQuery(
      db,
      organizationId,
      config,
      resolved,
      steps,
   );

   return {
      steps: buildStepResults(counts, steps),
      overallConversion: computeOverallConversion(counts),
   };
}

// ──────────────────────────────────────────────
// Internal Types
// ──────────────────────────────────────────────

interface FunnelStepDef {
   stepIndex: number;
   event: string;
   label: string;
   filters: Filter[];
}

type StepCountRow = Record<string, unknown> & {
   step_index: number;
   user_count: number;
};

// ──────────────────────────────────────────────
// Query Builder
// ──────────────────────────────────────────────

function buildFunnelSteps(config: FunnelsConfig): FunnelStepDef[] {
   return config.steps.map((step, i) => ({
      stepIndex: i + 1,
      event: step.event,
      label: step.label ?? step.event,
      filters: step.filters ?? [],
   }));
}

/**
 * Builds and executes the CTE-chain funnel query.
 *
 * Returns an array of user counts per step index, ordered by step.
 */
async function runFunnelQuery(
   db: DatabaseInstance,
   organizationId: string,
   config: FunnelsConfig,
   dateRange: ResolvedDateRange,
   steps: FunnelStepDef[],
): Promise<number[]> {
   const intervalExpression = buildIntervalExpression(config);

   // Build CTE parts
   const cteParts: ReturnType<typeof sql>[] = [];
   const selectParts: ReturnType<typeof sql>[] = [];

   for (const step of steps) {
      const stepAlias = `step_${step.stepIndex}`;

      if (step.stepIndex === 1) {
         // Step 1: Find first occurrence of the event per user within the date range
         const filterClause = buildStepFilterClause(step.filters);

         cteParts.push(
            sql.join(
               [
                  sql.raw(`${stepAlias} AS (`),
                  sql`SELECT DISTINCT ON (user_id) user_id, timestamp AS ts FROM events WHERE organization_id = ${organizationId} AND event_name = ${step.event} AND timestamp >= ${dateRange.start} AND timestamp < ${dateRange.end}`,
                  filterClause,
                  sql` ORDER BY user_id, timestamp`,
                  sql.raw(")"),
               ],
               sql` `,
            ),
         );
      } else {
         // Step N: Join on previous step's users with temporal ordering + conversion window
         const prevAlias = `step_${step.stepIndex - 1}`;
         const filterClause = buildStepFilterClause(step.filters, "e");

         cteParts.push(
            sql.join(
               [
                  sql.raw(`${stepAlias} AS (`),
                  sql.raw(
                     `SELECT DISTINCT ON (prev.user_id) prev.user_id, e.timestamp AS ts FROM ${prevAlias} prev`,
                  ),
                  sql.raw(
                     ` JOIN events e ON e.user_id = prev.user_id AND e.organization_id = `,
                  ),
                  sql`${organizationId}`,
                  sql.raw(` AND e.event_name = `),
                  sql`${step.event}`,
                  sql.raw(
                     ` AND e.timestamp > prev.ts AND e.timestamp <= prev.ts + `,
                  ),
                  sql.raw(intervalExpression),
                  filterClause,
                  sql.raw(` ORDER BY prev.user_id, e.timestamp`),
                  sql.raw(")"),
               ],
               sql``,
            ),
         );
      }

      // Build the SELECT for this step's count
      selectParts.push(
         sql.raw(
            `SELECT ${step.stepIndex} AS step_index, COUNT(*)::int AS user_count FROM ${stepAlias}`,
         ),
      );
   }

   // Assemble the full query
   const cteClause = sql.join(
      [sql.raw("WITH "), sql.join(cteParts, sql.raw(",\n"))],
      sql``,
   );

   const selectClause = sql.join(selectParts, sql.raw("\nUNION ALL\n"));
   const orderClause = sql.raw("\nORDER BY step_index");

   const fullQuery = sql.join(
      [cteClause, sql.raw("\n"), selectClause, orderClause],
      sql``,
   );

   try {
      const result = await db.execute<StepCountRow>(fullQuery);

      // Map step_index -> user_count, defaulting to 0 for missing steps
      const counts: number[] = new Array(steps.length).fill(0) as number[];
      for (const row of result.rows) {
         const idx = row.step_index - 1;
         if (idx >= 0 && idx < counts.length) {
            counts[idx] = Number(row.user_count);
         }
      }

      return counts;
   } catch (error) {
      propagateError(error);
      throw AppError.database("Failed to execute funnels query", {
         cause: error,
      });
   }
}

// ──────────────────────────────────────────────
// Filter SQL Builder
// ──────────────────────────────────────────────

/**
 * Builds an AND-chain of filter conditions for a funnel step.
 * Returns an empty SQL fragment if there are no filters.
 *
 * @param tablePrefix - Optional table alias prefix for column references (e.g. "e")
 */
function buildStepFilterClause(
   filters: Filter[],
   tablePrefix?: string,
): ReturnType<typeof sql> {
   if (filters.length === 0) {
      return sql``;
   }

   const prefix = tablePrefix ? `${tablePrefix}.` : "";
   const conditions = filters.map((f) => buildSingleFilter(f, prefix));

   return sql.join([sql` AND `, sql.join(conditions, sql` AND `)], sql``);
}

function buildSingleFilter(
   filter: Filter,
   prefix: string,
): ReturnType<typeof sql> {
   const col = sql.raw(
      `${prefix}properties->>'${escapeSqlIdentifier(filter.property)}'`,
   );

   const safeNumericCol = sql.raw(
      `CASE WHEN ${prefix}properties->>'${escapeSqlIdentifier(filter.property)}' ~ '^-?[0-9]*\\.?[0-9]+$' THEN (${prefix}properties->>'${escapeSqlIdentifier(filter.property)}')::numeric ELSE NULL END`,
   );

   switch (filter.operator) {
      case "eq":
         return sql`${col} = ${String(filter.value ?? "")}`;
      case "neq":
         return sql`${col} != ${String(filter.value ?? "")}`;
      case "gt":
         return sql`${safeNumericCol} > ${Number(filter.value ?? 0)}`;
      case "lt":
         return sql`${safeNumericCol} < ${Number(filter.value ?? 0)}`;
      case "gte":
         return sql`${safeNumericCol} >= ${Number(filter.value ?? 0)}`;
      case "lte":
         return sql`${safeNumericCol} <= ${Number(filter.value ?? 0)}`;
      case "contains":
         return sql`${col} ILIKE ${`%${String(filter.value ?? "")}%`}`;
      case "not_contains":
         return sql`${col} NOT ILIKE ${`%${String(filter.value ?? "")}%`}`;
      case "is_set":
         return sql.raw(
            `${prefix}properties ? '${escapeSqlIdentifier(filter.property)}'`,
         );
      case "is_not_set":
         return sql.raw(
            `NOT (${prefix}properties ? '${escapeSqlIdentifier(filter.property)}')`,
         );
   }
}

/**
 * Escapes a string for safe use in SQL identifiers/JSON paths.
 * Prevents SQL injection in property names used in raw SQL.
 */
function escapeSqlIdentifier(value: string): string {
   return value.replace(/'/g, "''").replace(/\\/g, "\\\\");
}

// ──────────────────────────────────────────────
// Interval Builder
// ──────────────────────────────────────────────

/**
 * Builds a PostgreSQL INTERVAL expression from the conversion window config.
 *
 * The unit comes from a validated enum (minute/hour/day/week) so it's safe
 * for sql.raw(). The value is a validated positive integer.
 */
function buildIntervalExpression(config: FunnelsConfig): string {
   const { value, unit } = config.conversionWindow;

   const pgUnit: string = {
      minute: "minutes",
      hour: "hours",
      day: "days",
      week: "weeks",
   }[unit];

   return `INTERVAL '${value} ${pgUnit}'`;
}

// ──────────────────────────────────────────────
// Result Computation
// ──────────────────────────────────────────────

/**
 * Builds the full FunnelStepResult array from raw step counts.
 */
function buildStepResults(
   counts: number[],
   steps: FunnelStepDef[],
): FunnelStepResult[] {
   const firstCount = counts[0] ?? 0;

   return steps.map((step, i) => {
      const count = counts[i] ?? 0;
      const previousCount = i > 0 ? (counts[i - 1] ?? 0) : count;

      return {
         stepIndex: step.stepIndex,
         event: step.event,
         label: step.label,
         count,
         conversionFromPrevious:
            i === 0
               ? 100
               : previousCount > 0
                 ? round((count / previousCount) * 100)
                 : 0,
         conversionFromFirst:
            firstCount > 0 ? round((count / firstCount) * 100) : 0,
         dropoff: i === 0 ? 0 : previousCount - count,
         medianTime: undefined,
      };
   });
}

/**
 * Computes overall funnel conversion: last step count / first step count.
 */
function computeOverallConversion(counts: number[]): number {
   if (counts.length < 2) return 100;

   const first = counts[0] ?? 0;
   const last = counts[counts.length - 1] ?? 0;

   return first > 0 ? round((last / first) * 100) : 0;
}

/**
 * Rounds a number to two decimal places.
 */
function round(value: number): number {
   return Math.round(value * 100) / 100;
}
