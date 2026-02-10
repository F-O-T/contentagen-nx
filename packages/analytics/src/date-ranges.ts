import type { DateRange } from "./types";

// ──────────────────────────────────────────────
// Public Types
// ──────────────────────────────────────────────

export interface ResolvedDateRange {
   start: Date;
   end: Date;
}

export interface ResolvedDateRangeWithComparison extends ResolvedDateRange {
   previous: ResolvedDateRange;
}

// ──────────────────────────────────────────────
// Public Functions
// ──────────────────────────────────────────────

/**
 * Resolves a relative or absolute date range to concrete start/end dates.
 */
export function resolveDateRange(dateRange: DateRange): ResolvedDateRange {
   if (dateRange.type === "absolute") {
      return {
         start: new Date(dateRange.start),
         end: new Date(dateRange.end),
      };
   }

   const now = new Date();
   const end = startOfDay(addDays(now, 1)); // end of today (exclusive)

   switch (dateRange.value) {
      case "7d":
         return { start: startOfDay(subDays(now, 7)), end };
      case "14d":
         return { start: startOfDay(subDays(now, 14)), end };
      case "30d":
         return { start: startOfDay(subDays(now, 30)), end };
      case "90d":
         return { start: startOfDay(subDays(now, 90)), end };
      case "180d":
         return { start: startOfDay(subDays(now, 180)), end };
      case "12m":
         return { start: startOfDay(subMonths(now, 12)), end };
      case "this_month":
         return { start: startOfMonth(now), end };
      case "last_month": {
         const lastMonth = subMonths(now, 1);
         return {
            start: startOfMonth(lastMonth),
            end: startOfMonth(now),
         };
      }
      case "this_quarter":
         return { start: startOfQuarter(now), end };
      case "this_year":
         return { start: startOfYear(now), end };
   }
}

/**
 * Resolves the main date range and computes the previous period of equal length
 * for comparison purposes.
 */
export function resolveDateRangeWithComparison(
   dateRange: DateRange,
): ResolvedDateRangeWithComparison {
   const resolved = resolveDateRange(dateRange);
   const durationMs = resolved.end.getTime() - resolved.start.getTime();

   const previous: ResolvedDateRange = {
      start: new Date(resolved.start.getTime() - durationMs),
      end: new Date(resolved.end.getTime() - durationMs),
   };

   return {
      ...resolved,
      previous,
   };
}

// ──────────────────────────────────────────────
// Private Date Helpers
// ──────────────────────────────────────────────

function startOfDay(date: Date): Date {
   const d = new Date(date);
   d.setHours(0, 0, 0, 0);
   return d;
}

function addDays(date: Date, days: number): Date {
   const d = new Date(date);
   d.setDate(d.getDate() + days);
   return d;
}

function subDays(date: Date, days: number): Date {
   return addDays(date, -days);
}

function subMonths(date: Date, months: number): Date {
   const d = new Date(date);
   d.setMonth(d.getMonth() - months);
   return d;
}

function startOfMonth(date: Date): Date {
   const d = new Date(date);
   d.setDate(1);
   d.setHours(0, 0, 0, 0);
   return d;
}

function startOfQuarter(date: Date): Date {
   const d = new Date(date);
   const month = d.getMonth();
   const quarterStartMonth = month - (month % 3);
   d.setMonth(quarterStartMonth, 1);
   d.setHours(0, 0, 0, 0);
   return d;
}

function startOfYear(date: Date): Date {
   const d = new Date(date);
   d.setMonth(0, 1);
   d.setHours(0, 0, 0, 0);
   return d;
}
