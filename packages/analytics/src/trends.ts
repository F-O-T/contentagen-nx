import type { DatabaseInstance } from "@packages/database/client";
import { events } from "@packages/database/schema";
import { AppError, propagateError } from "@packages/utils/errors";
import { sql } from "drizzle-orm";

import {
   resolveDateRange,
   resolveDateRangeWithComparison,
} from "./date-ranges";
import { evaluateFormula } from "./formula";
import type {
   Filter,
   Interval,
   TrendsConfig,
   TrendsDataPoint,
   TrendsResult,
   TrendsSeries,
} from "./types";

// ──────────────────────────────────────────────
// Main Entry Point
// ──────────────────────────────────────────────

export async function executeTrendsQuery(
   db: DatabaseInstance,
   organizationId: string,
   config: TrendsConfig,
): Promise<TrendsResult> {
   if (config.compare) {
      return executeWithComparison(db, organizationId, config);
   }

   const { start, end } = resolveDateRange(config.dateRange);

   const seriesResults = await Promise.all(
      config.series.map((series, index) =>
         executeSeriesQuery(
            db,
            organizationId,
            series,
            config,
            start,
            end,
            index,
         ),
      ),
   );

   const data = seriesResults.flat();
   const totals = computeTotals(seriesResults);

   const result: TrendsResult = { data, totals };

   if (config.formula) {
      const { formulaData, formulaTotals } = computeFormulaTimeSeries(
         seriesResults,
         config.formula,
         config.interval,
      );
      result.formulaData = formulaData;
      result.formulaTotals = formulaTotals;
   }

   return result;
}

// ──────────────────────────────────────────────
// Comparison Support
// ──────────────────────────────────────────────

async function executeWithComparison(
   db: DatabaseInstance,
   organizationId: string,
   config: TrendsConfig,
): Promise<TrendsResult> {
   const resolved = resolveDateRangeWithComparison(config.dateRange);
   const { start, end, previous } = resolved;

   const [currentResults, previousResults] = await Promise.all([
      Promise.all(
         config.series.map((series, index) =>
            executeSeriesQuery(
               db,
               organizationId,
               series,
               config,
               start,
               end,
               index,
            ),
         ),
      ),
      Promise.all(
         config.series.map((series, index) =>
            executeSeriesQuery(
               db,
               organizationId,
               series,
               config,
               previous.start,
               previous.end,
               index,
            ),
         ),
      ),
   ]);

   const currentData = currentResults.flat();
   const currentTotals = computeTotals(currentResults);
   const previousData = previousResults.flat();
   const previousTotals = computeTotals(previousResults);

   const percentageChanges = currentTotals.map((current) => {
      const prev = previousTotals.find(
         (p) => p.seriesIndex === current.seriesIndex,
      );
      const prevTotal = prev?.total ?? 0;
      const change =
         prevTotal === 0
            ? current.total === 0
               ? 0
               : 100
            : ((current.total - prevTotal) / prevTotal) * 100;
      return { seriesIndex: current.seriesIndex, change };
   });

   const result: TrendsResult = {
      data: currentData,
      totals: currentTotals,
      comparison: {
         data: previousData,
         totals: previousTotals,
         percentageChanges,
      },
   };

   if (config.formula) {
      const current = computeFormulaTimeSeries(
         currentResults,
         config.formula,
         config.interval,
      );
      const previous = computeFormulaTimeSeries(
         previousResults,
         config.formula,
         config.interval,
      );
      result.formulaData = current.formulaData;
      result.formulaTotals = current.formulaTotals;
      if (result.comparison) {
         result.comparison.formulaData = previous.formulaData;
         result.comparison.formulaTotals = previous.formulaTotals;
      }
   }

   return result;
}

// ──────────────────────────────────────────────
// Series Query Execution
// ──────────────────────────────────────────────

interface RawSeriesRow {
   interval_start: string;
   value: string;
   breakdown_value: string | null;
   [key: string]: unknown;
}

export async function executeSeriesQuery(
   db: DatabaseInstance,
   organizationId: string,
   series: TrendsSeries,
   config: TrendsConfig,
   start: Date,
   end: Date,
   seriesIndex: number,
): Promise<TrendsDataPoint[]> {
   const intervalTrunc = sql.raw(`'${config.interval}'`);
   const aggregation = buildAggregation(series);

   const filterConditions = (config.filters ?? []).map(buildFilterCondition);

   const breakdownSelect = config.breakdown
      ? sql`, ${events.properties}->>${config.breakdown.property} AS breakdown_value`
      : sql` , NULL AS breakdown_value`;

   const breakdownGroupBy = config.breakdown ? sql`, breakdown_value` : sql``;

   const filtersSql =
      filterConditions.length > 0
         ? sql.join(
              filterConditions.map((f) => sql` AND ${f}`),
              sql``,
           )
         : sql``;

   const query = sql`
		SELECT
			DATE_TRUNC(${intervalTrunc}, ${events.timestamp}) AS interval_start,
			${aggregation} AS value
			${breakdownSelect}
		FROM ${events}
		WHERE ${events.organizationId} = ${organizationId}
			AND ${events.eventName} = ${series.event}
			AND ${events.timestamp} >= ${start}
			AND ${events.timestamp} < ${end}
			${filtersSql}
		GROUP BY DATE_TRUNC(${intervalTrunc}, ${events.timestamp})
			${breakdownGroupBy}
		ORDER BY interval_start ASC
	`;

   try {
      const rows = await db.execute<RawSeriesRow>(query);

      return rows.rows.map((row) => ({
         intervalStart: new Date(row.interval_start).toISOString(),
         value: Number(row.value) || 0,
         breakdownValue: row.breakdown_value ?? null,
         seriesIndex,
      }));
   } catch (error) {
      propagateError(error);
      throw AppError.database(
         `Failed to execute trends query for series "${series.event}"`,
         { cause: error },
      );
   }
}

// ──────────────────────────────────────────────
// Aggregation Builder
// ──────────────────────────────────────────────

function buildAggregation(series: TrendsSeries) {
   switch (series.math) {
      case "count":
         return sql`COUNT(*)`;
      case "unique_users":
         return sql`COUNT(DISTINCT ${events.userId})`;
      case "sum": {
         const prop = series.mathProperty ?? "";
         if (!prop) return sql`COUNT(*)`;
         return sql`COALESCE(SUM(CASE WHEN ${events.properties}->>${prop} ~ '^-?[0-9]*\\.?[0-9]+$' THEN (${events.properties}->>${prop})::numeric ELSE NULL END), 0)`;
      }
      case "avg": {
         const prop = series.mathProperty ?? "";
         if (!prop) return sql`COUNT(*)`;
         return sql`COALESCE(AVG(CASE WHEN ${events.properties}->>${prop} ~ '^-?[0-9]*\\.?[0-9]+$' THEN (${events.properties}->>${prop})::numeric ELSE NULL END), 0)`;
      }
      case "min": {
         const prop = series.mathProperty ?? "";
         if (!prop) return sql`COUNT(*)`;
         return sql`MIN(CASE WHEN ${events.properties}->>${prop} ~ '^-?[0-9]*\\.?[0-9]+$' THEN (${events.properties}->>${prop})::numeric ELSE NULL END)`;
      }
      case "max": {
         const prop = series.mathProperty ?? "";
         if (!prop) return sql`COUNT(*)`;
         return sql`MAX(CASE WHEN ${events.properties}->>${prop} ~ '^-?[0-9]*\\.?[0-9]+$' THEN (${events.properties}->>${prop})::numeric ELSE NULL END)`;
      }
   }
}

// ──────────────────────────────────────────────
// Filter Builder
// ──────────────────────────────────────────────

export function buildFilterCondition(filter: Filter) {
   const propAccess = sql`${events.properties}->>${filter.property}`;
   const safeNumericAccess = sql`CASE WHEN ${events.properties}->>${filter.property} ~ '^-?[0-9]*\\.?[0-9]+$' THEN (${events.properties}->>${filter.property})::numeric ELSE NULL END`;

   switch (filter.operator) {
      case "eq":
         return sql`${propAccess} = ${String(filter.value)}`;
      case "neq":
         return sql`${propAccess} != ${String(filter.value)}`;
      case "gt":
         return sql`${safeNumericAccess} > ${Number(filter.value)}`;
      case "lt":
         return sql`${safeNumericAccess} < ${Number(filter.value)}`;
      case "gte":
         return sql`${safeNumericAccess} >= ${Number(filter.value)}`;
      case "lte":
         return sql`${safeNumericAccess} <= ${Number(filter.value)}`;
      case "contains":
         return sql`${propAccess} ILIKE ${`%${String(filter.value)}%`}`;
      case "not_contains":
         return sql`${propAccess} NOT ILIKE ${`%${String(filter.value)}%`}`;
      case "is_set":
         return sql`${events.properties} ? ${filter.property}`;
      case "is_not_set":
         return sql`NOT (${events.properties} ? ${filter.property})`;
   }
}

// ──────────────────────────────────────────────
// Formula Computation
// ──────────────────────────────────────────────

export function computeFormulaTimeSeries(
   seriesResults: TrendsDataPoint[][],
   formula: string,
   _interval: Interval,
): {
   formulaData: Array<{ intervalStart: string; value: number }>;
   formulaTotals: { value: number };
} {
   // Collect all unique interval timestamps across all series
   const intervalSet = new Set<string>();
   for (const series of seriesResults) {
      for (const point of series) {
         intervalSet.add(point.intervalStart);
      }
   }

   const sortedIntervals = [...intervalSet].sort();

   // Build lookup maps: seriesIndex -> intervalStart -> value
   const seriesLookup = new Map<number, Map<string, number>>();
   for (const series of seriesResults) {
      for (const point of series) {
         let intervalMap = seriesLookup.get(point.seriesIndex);
         if (!intervalMap) {
            intervalMap = new Map<string, number>();
            seriesLookup.set(point.seriesIndex, intervalMap);
         }
         // Accumulate values for same interval (breakdown values get summed)
         const existing = intervalMap.get(point.intervalStart) ?? 0;
         intervalMap.set(point.intervalStart, existing + point.value);
      }
   }

   // Evaluate formula per interval
   const formulaData: Array<{ intervalStart: string; value: number }> = [];

   for (const interval of sortedIntervals) {
      const values: Record<string, number> = {};

      for (let i = 0; i < seriesResults.length; i++) {
         const letter = String.fromCharCode(65 + i); // A, B, C, ...
         const intervalMap = seriesLookup.get(i);
         values[letter] = intervalMap?.get(interval) ?? 0;
      }

      let result: number | null;
      try {
         result = evaluateFormula(formula, values);
      } catch {
         result = null;
      }
      formulaData.push({
         intervalStart: interval,
         value: result ?? 0,
      });
   }

   // Compute formula total as sum of per-interval formula values
   const formulaTotal = formulaData.reduce(
      (sum, point) => sum + point.value,
      0,
   );

   return {
      formulaData,
      formulaTotals: { value: formulaTotal },
   };
}

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function computeTotals(
   seriesResults: TrendsDataPoint[][],
): Array<{ seriesIndex: number; total: number }> {
   return seriesResults.map((points, index) => ({
      seriesIndex: index,
      total: points.reduce((sum, point) => sum + point.value, 0),
   }));
}
