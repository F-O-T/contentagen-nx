import { z } from "zod";

// ──────────────────────────────────────────────
// Shared Primitives
// ──────────────────────────────────────────────

export const filterOperatorSchema = z.enum([
   "eq",
   "neq",
   "gt",
   "lt",
   "gte",
   "lte",
   "contains",
   "not_contains",
   "is_set",
   "is_not_set",
]);

export const filterSchema = z.object({
   property: z.string(),
   operator: filterOperatorSchema,
   value: z.union([z.string(), z.number(), z.boolean()]).optional(),
});

export const relativeDateRangeSchema = z.object({
   type: z.literal("relative"),
   value: z.enum([
      "7d",
      "14d",
      "30d",
      "90d",
      "180d",
      "12m",
      "this_month",
      "last_month",
      "this_quarter",
      "this_year",
   ]),
});

export const absoluteDateRangeSchema = z.object({
   type: z.literal("absolute"),
   start: z.string().datetime(),
   end: z.string().datetime(),
});

export const dateRangeSchema = z.discriminatedUnion("type", [
   relativeDateRangeSchema,
   absoluteDateRangeSchema,
]);

export const intervalSchema = z.enum(["hour", "day", "week", "month"]);

export const breakdownSchema = z.object({
   property: z.string(),
   type: z.enum(["event", "person"]).default("event"),
});

export const mathOperationSchema = z.enum([
   "count",
   "sum",
   "avg",
   "min",
   "max",
   "unique_users",
]);

// ──────────────────────────────────────────────
// Trends Config
// ──────────────────────────────────────────────

export const trendsSeriesSchema = z
   .object({
      event: z.string(),
      math: mathOperationSchema.default("count"),
      mathProperty: z.string().optional(),
      label: z.string().optional(),
   })
   .refine(
      (data) => {
         const needsProperty = ["sum", "avg", "min", "max"];
         if (needsProperty.includes(data.math)) {
            return !!data.mathProperty;
         }
         return true;
      },
      {
         message: "mathProperty is required when math is sum, avg, min, or max",
         path: ["mathProperty"],
      },
   );

export const trendsConfigSchema = z.object({
   type: z.literal("trends"),
   series: z.array(trendsSeriesSchema).min(1).max(10),
   filters: z.array(filterSchema).optional().default([]),
   breakdown: breakdownSchema.optional(),
   dateRange: dateRangeSchema,
   interval: intervalSchema.default("day"),
   compare: z.boolean().optional().default(false),
   formula: z.string().optional(),
   chartType: z.enum(["line", "bar", "area", "number"]).default("line"),
});

// ──────────────────────────────────────────────
// Funnels Config
// ──────────────────────────────────────────────

export const funnelStepSchema = z.object({
   event: z.string(),
   label: z.string().optional(),
   filters: z.array(filterSchema).optional().default([]),
});

export const funnelExclusionSchema = z.object({
   event: z.string(),
   afterStep: z.number().int().min(0),
   beforeStep: z.number().int().min(1),
});

export const funnelsConfigSchema = z.object({
   type: z.literal("funnels"),
   steps: z.array(funnelStepSchema).min(2).max(10),
   conversionWindow: z.object({
      value: z.number().int().positive(),
      unit: z.enum(["minute", "hour", "day", "week"]).default("day"),
   }),
   dateRange: dateRangeSchema,
   breakdown: breakdownSchema.optional(),
   exclusions: z.array(funnelExclusionSchema).optional().default([]),
   compare: z.boolean().optional().default(false),
});

// ──────────────────────────────────────────────
// Retention Config
// ──────────────────────────────────────────────

const retentionEventSchema = z.object({
   event: z.string(),
   filters: z.array(filterSchema).optional(),
});

export const retentionConfigSchema = z.object({
   type: z.literal("retention"),
   startEvent: retentionEventSchema,
   returnEvent: retentionEventSchema,
   period: z.enum(["day", "week", "month"]).default("week"),
   totalPeriods: z.number().int().min(1).max(52).default(8),
   dateRange: dateRangeSchema,
   compare: z.boolean().optional().default(false),
});

// ──────────────────────────────────────────────
// Union
// ──────────────────────────────────────────────

export const insightConfigSchema = z.discriminatedUnion("type", [
   trendsConfigSchema,
   funnelsConfigSchema,
   retentionConfigSchema,
]);

// ──────────────────────────────────────────────
// Inferred Types
// ──────────────────────────────────────────────

export type Filter = z.infer<typeof filterSchema>;
export type DateRange = z.infer<typeof dateRangeSchema>;
export type Interval = z.infer<typeof intervalSchema>;
export type Breakdown = z.infer<typeof breakdownSchema>;
export type MathOperation = z.infer<typeof mathOperationSchema>;
export type TrendsSeries = z.infer<typeof trendsSeriesSchema>;
export type TrendsConfig = z.infer<typeof trendsConfigSchema>;
export type FunnelStep = z.infer<typeof funnelStepSchema>;
export type FunnelsConfig = z.infer<typeof funnelsConfigSchema>;
export type RetentionConfig = z.infer<typeof retentionConfigSchema>;
export type InsightConfig = z.infer<typeof insightConfigSchema>;

// ──────────────────────────────────────────────
// Query Result Interfaces
// ──────────────────────────────────────────────

export interface TrendsDataPoint {
   intervalStart: string;
   value: number;
   breakdownValue?: string | null;
   seriesIndex: number;
}

export interface TrendsResult {
   data: TrendsDataPoint[];
   totals: Array<{ seriesIndex: number; total: number }>;
   formulaData?: Array<{ intervalStart: string; value: number }>;
   formulaTotals?: { value: number };
   comparison?: {
      data: TrendsDataPoint[];
      totals: Array<{ seriesIndex: number; total: number }>;
      formulaData?: Array<{ intervalStart: string; value: number }>;
      formulaTotals?: { value: number };
      percentageChanges: Array<{ seriesIndex: number; change: number }>;
   };
}

export interface FunnelStepResult {
   stepIndex: number;
   event: string;
   label: string;
   count: number;
   conversionFromPrevious: number;
   conversionFromFirst: number;
   dropoff: number;
   medianTime?: number;
}

export interface FunnelsResult {
   steps: FunnelStepResult[];
   overallConversion: number;
   comparison?: {
      steps: FunnelStepResult[];
      overallConversion: number;
      conversionChange: number;
   };
}

export interface RetentionCohort {
   cohortLabel: string;
   cohortSize: number;
   retentionByPeriod: Array<{
      period: number;
      retained: number;
      percentage: number;
   }>;
}

export interface RetentionResult {
   cohorts: RetentionCohort[];
   comparison?: {
      cohorts: RetentionCohort[];
   };
}
