# Custom Dashboard System — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace PostHog analytics queries with an internal query engine, make the home page a customizable default dashboard (like PostHog), and support trends/funnels/retention insight types with formula support and period comparison.

**Architecture:** New `packages/analytics/` package contains the query engine (SQL builders for trends/funnels/retention), shared Zod schemas, and formula evaluator. Materialized views power the default dashboard tiles for fast reads. Custom insights query the `events` table dynamically with parameterized SQL. The home page becomes the org's default dashboard. Worker refreshes all materialized views hourly.

**Tech Stack:** PostgreSQL (events table + materialized views), Drizzle ORM, oRPC, Zod, React, Recharts, @dnd-kit, TanStack Query

---

## Phase 1: Analytics Query Engine Package

### Task 1: Create `packages/analytics/` package scaffold

**Files:**
- Create: `packages/analytics/package.json`
- Create: `packages/analytics/tsconfig.json`
- Create: `packages/analytics/src/types.ts`

**Step 1: Create package.json**

```json
{
  "name": "@packages/analytics",
  "type": "module",
  "private": true,
  "exports": {
    "./types": {
      "default": "./src/types.ts",
      "types": "./dist/src/types.d.ts"
    },
    "./trends": {
      "default": "./src/trends.ts",
      "types": "./dist/src/trends.d.ts"
    },
    "./funnels": {
      "default": "./src/funnels.ts",
      "types": "./dist/src/funnels.d.ts"
    },
    "./retention": {
      "default": "./src/retention.ts",
      "types": "./dist/src/retention.d.ts"
    },
    "./formula": {
      "default": "./src/formula.ts",
      "types": "./dist/src/formula.d.ts"
    },
    "./date-ranges": {
      "default": "./src/date-ranges.ts",
      "types": "./dist/src/date-ranges.d.ts"
    },
    "./default-dashboard": {
      "default": "./src/default-dashboard.ts",
      "types": "./dist/src/default-dashboard.d.ts"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsc --build",
    "typecheck": "tsc"
  }
}
```

**Step 2: Create tsconfig.json**

Follow the same pattern as other packages (e.g., `packages/events/tsconfig.json`). Extend from `tooling/typescript`.

**Step 3: Create `src/types.ts` — shared Zod schemas for all insight configs**

```typescript
import { z } from "zod";

// ─── Shared primitives ───────────────────────────────────────────────

export const filterOperatorSchema = z.enum([
   "eq", "neq", "gt", "lt", "gte", "lte",
   "contains", "not_contains", "is_set", "is_not_set",
]);

export const filterSchema = z.object({
   property: z.string(),
   operator: filterOperatorSchema,
   value: z.union([z.string(), z.number(), z.boolean()]).optional(),
});

export const dateRangeTypeSchema = z.enum(["relative", "absolute"]);

export const relativeDateRangeSchema = z.object({
   type: z.literal("relative"),
   value: z.enum(["7d", "14d", "30d", "90d", "180d", "12m", "this_month", "last_month", "this_quarter", "this_year"]),
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
   "count", "sum", "avg", "min", "max", "unique_users",
]);

// ─── Trends ──────────────────────────────────────────────────────────

export const trendsSeriesSchema = z.object({
   event: z.string(),
   math: mathOperationSchema.default("count"),
   mathProperty: z.string().optional(),
   label: z.string().optional(),
});

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

// ─── Funnels ─────────────────────────────────────────────────────────

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

// ─── Retention ───────────────────────────────────────────────────────

export const retentionConfigSchema = z.object({
   type: z.literal("retention"),
   startEvent: z.object({
      event: z.string(),
      filters: z.array(filterSchema).optional().default([]),
   }),
   returnEvent: z.object({
      event: z.string(),
      filters: z.array(filterSchema).optional().default([]),
   }),
   period: z.enum(["day", "week", "month"]).default("week"),
   totalPeriods: z.number().int().min(1).max(52).default(8),
   dateRange: dateRangeSchema,
   compare: z.boolean().optional().default(false),
});

// ─── Union ───────────────────────────────────────────────────────────

export const insightConfigSchema = z.discriminatedUnion("type", [
   trendsConfigSchema,
   funnelsConfigSchema,
   retentionConfigSchema,
]);

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

// ─── Query Results ───────────────────────────────────────────────────

export interface TrendsDataPoint {
   intervalStart: string;          // ISO date string
   value: number;
   breakdownValue?: string | null;
   seriesIndex: number;            // which series (0=A, 1=B, ...)
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
   conversionFromPrevious: number;  // percentage
   conversionFromFirst: number;     // percentage
   dropoff: number;                 // users lost from previous step
   medianTime?: number;             // seconds to reach this step
}

export interface FunnelsResult {
   steps: FunnelStepResult[];
   overallConversion: number;
   comparison?: {
      steps: FunnelStepResult[];
      overallConversion: number;
      conversionChange: number;     // percentage point change
   };
}

export interface RetentionCohort {
   cohortLabel: string;            // e.g., "Jan 6 - Jan 12"
   cohortSize: number;
   retentionByPeriod: Array<{
      period: number;              // 0, 1, 2, ...
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
```

**Step 4: Commit**

```
feat(analytics): create analytics package with shared types and Zod schemas
```

---

### Task 2: Implement date range utilities

**Files:**
- Create: `packages/analytics/src/date-ranges.ts`

**Step 1: Write `date-ranges.ts`**

Utility to resolve relative/absolute date ranges to concrete `{ start: Date; end: Date }` pairs, including previous-period computation for comparison.

```typescript
import type { DateRange } from "./types";

export interface ResolvedDateRange {
   start: Date;
   end: Date;
}

export interface ResolvedDateRangeWithComparison extends ResolvedDateRange {
   previous: ResolvedDateRange;
}

export function resolveDateRange(dateRange: DateRange): ResolvedDateRange {
   if (dateRange.type === "absolute") {
      return {
         start: new Date(dateRange.start),
         end: new Date(dateRange.end),
      };
   }
   const now = new Date();
   const today = startOfDay(now);

   switch (dateRange.value) {
      case "7d":
         return { start: subDays(today, 7), end: now };
      case "14d":
         return { start: subDays(today, 14), end: now };
      case "30d":
         return { start: subDays(today, 30), end: now };
      case "90d":
         return { start: subDays(today, 90), end: now };
      case "180d":
         return { start: subDays(today, 180), end: now };
      case "12m":
         return { start: subMonths(today, 12), end: now };
      case "this_month":
         return { start: startOfMonth(now), end: now };
      case "last_month":
         return {
            start: startOfMonth(subMonths(now, 1)),
            end: endOfMonth(subMonths(now, 1)),
         };
      case "this_quarter":
         return { start: startOfQuarter(now), end: now };
      case "this_year":
         return { start: startOfYear(now), end: now };
   }
}

/**
 * Compute the previous period of equal length for comparison.
 * e.g., if current is 30d, previous is the 30d before that.
 */
export function resolveDateRangeWithComparison(
   dateRange: DateRange,
): ResolvedDateRangeWithComparison {
   const current = resolveDateRange(dateRange);
   const durationMs = current.end.getTime() - current.start.getTime();
   return {
      ...current,
      previous: {
         start: new Date(current.start.getTime() - durationMs),
         end: new Date(current.start.getTime()),
      },
   };
}

// Minimal date helpers (avoid date-fns dependency if not already present)
function startOfDay(d: Date): Date {
   const r = new Date(d);
   r.setHours(0, 0, 0, 0);
   return r;
}
function subDays(d: Date, n: number): Date {
   const r = new Date(d);
   r.setDate(r.getDate() - n);
   return r;
}
function subMonths(d: Date, n: number): Date {
   const r = new Date(d);
   r.setMonth(r.getMonth() - n);
   return r;
}
function startOfMonth(d: Date): Date {
   return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date): Date {
   return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}
function startOfQuarter(d: Date): Date {
   const q = Math.floor(d.getMonth() / 3) * 3;
   return new Date(d.getFullYear(), q, 1);
}
function startOfYear(d: Date): Date {
   return new Date(d.getFullYear(), 0, 1);
}
```

**Step 2: Commit**

```
feat(analytics): add date range resolution with comparison support
```

---

### Task 3: Implement formula evaluator

**Files:**
- Create: `packages/analytics/src/formula.ts`

**Step 1: Write `formula.ts`**

Simple math expression evaluator for formulas like `A/B*100`, `(A-B)/A`. Series are labeled A-Z mapping to series[0]-series[25].

```typescript
/**
 * Evaluate a formula expression with series values.
 * Supports: +, -, *, /, parentheses, numeric literals, series labels A-Z.
 *
 * @param formula - e.g., "A/B*100", "(A-B)/A"
 * @param values  - Map of series label to value, e.g., { A: 150, B: 30 }
 * @returns Computed value, or null if division by zero
 */
export function evaluateFormula(
   formula: string,
   values: Record<string, number>,
): number | null {
   // Tokenize
   const tokens = tokenize(formula);
   // Parse into AST
   const ast = parseExpression(tokens, 0);
   // Evaluate
   return evaluate(ast.node, values);
}

// --- Tokenizer ---

type Token =
   | { type: "number"; value: number }
   | { type: "variable"; name: string }
   | { type: "operator"; op: "+" | "-" | "*" | "/" }
   | { type: "lparen" }
   | { type: "rparen" };

function tokenize(expr: string): Token[] {
   const tokens: Token[] = [];
   let i = 0;
   while (i < expr.length) {
      const ch = expr[i];
      if (ch === " " || ch === "\t") { i++; continue; }
      if (ch === "(") { tokens.push({ type: "lparen" }); i++; continue; }
      if (ch === ")") { tokens.push({ type: "rparen" }); i++; continue; }
      if (ch === "+" || ch === "-" || ch === "*" || ch === "/") {
         tokens.push({ type: "operator", op: ch }); i++; continue;
      }
      if (/[A-Z]/.test(ch)) {
         tokens.push({ type: "variable", name: ch }); i++; continue;
      }
      if (/[0-9.]/.test(ch)) {
         let num = "";
         while (i < expr.length && /[0-9.]/.test(expr[i])) {
            num += expr[i]; i++;
         }
         tokens.push({ type: "number", value: Number.parseFloat(num) });
         continue;
      }
      throw new Error(`Unexpected character: ${ch}`);
   }
   return tokens;
}

// --- Parser (recursive descent, respects precedence) ---

type ASTNode =
   | { type: "number"; value: number }
   | { type: "variable"; name: string }
   | { type: "binary"; op: "+" | "-" | "*" | "/"; left: ASTNode; right: ASTNode };

interface ParseResult { node: ASTNode; pos: number; }

function parseExpression(tokens: Token[], pos: number): ParseResult {
   let left = parseTerm(tokens, pos);
   while (left.pos < tokens.length) {
      const tok = tokens[left.pos];
      if (tok?.type === "operator" && (tok.op === "+" || tok.op === "-")) {
         const right = parseTerm(tokens, left.pos + 1);
         left = {
            node: { type: "binary", op: tok.op, left: left.node, right: right.node },
            pos: right.pos,
         };
      } else break;
   }
   return left;
}

function parseTerm(tokens: Token[], pos: number): ParseResult {
   let left = parseFactor(tokens, pos);
   while (left.pos < tokens.length) {
      const tok = tokens[left.pos];
      if (tok?.type === "operator" && (tok.op === "*" || tok.op === "/")) {
         const right = parseFactor(tokens, left.pos + 1);
         left = {
            node: { type: "binary", op: tok.op, left: left.node, right: right.node },
            pos: right.pos,
         };
      } else break;
   }
   return left;
}

function parseFactor(tokens: Token[], pos: number): ParseResult {
   const tok = tokens[pos];
   if (!tok) throw new Error("Unexpected end of expression");
   if (tok.type === "number") return { node: { type: "number", value: tok.value }, pos: pos + 1 };
   if (tok.type === "variable") return { node: { type: "variable", name: tok.name }, pos: pos + 1 };
   if (tok.type === "lparen") {
      const inner = parseExpression(tokens, pos + 1);
      if (tokens[inner.pos]?.type !== "rparen") throw new Error("Missing closing parenthesis");
      return { node: inner.node, pos: inner.pos + 1 };
   }
   throw new Error(`Unexpected token: ${JSON.stringify(tok)}`);
}

// --- Evaluator ---

function evaluate(node: ASTNode, values: Record<string, number>): number | null {
   if (node.type === "number") return node.value;
   if (node.type === "variable") {
      const val = values[node.name];
      if (val === undefined) throw new Error(`Unknown variable: ${node.name}`);
      return val;
   }
   const left = evaluate(node.left, values);
   const right = evaluate(node.right, values);
   if (left === null || right === null) return null;
   switch (node.op) {
      case "+": return left + right;
      case "-": return left - right;
      case "*": return left * right;
      case "/": return right === 0 ? null : left / right;
   }
}

/**
 * Validate a formula string. Returns null if valid, error message if invalid.
 */
export function validateFormula(formula: string, seriesCount: number): string | null {
   try {
      const tokens = tokenize(formula);
      const validLabels = Array.from({ length: seriesCount }, (_, i) =>
         String.fromCharCode(65 + i),
      );
      for (const tok of tokens) {
         if (tok.type === "variable" && !validLabels.includes(tok.name)) {
            return `Unknown series "${tok.name}". Available: ${validLabels.join(", ")}`;
         }
      }
      // Try parsing
      parseExpression(tokens, 0);
      return null;
   } catch (err) {
      return (err as Error).message;
   }
}
```

**Step 2: Commit**

```
feat(analytics): add formula evaluator for insight expressions
```

---

### Task 4: Implement trends query builder

**Files:**
- Create: `packages/analytics/src/trends.ts`

This is the core SQL builder for trends queries. It builds parameterized SQL that runs against the `events` table directly.

**Step 1: Write `trends.ts`**

```typescript
import { and, count, countDistinct, eq, gte, lt, sql, sum, avg, min, max } from "drizzle-orm";
import type { PgSelect } from "drizzle-orm/pg-core";
import { events } from "@packages/database/schema";
import type { DatabaseInstance } from "@packages/database/client";
import type { TrendsConfig, TrendsDataPoint, TrendsResult } from "./types";
import { evaluateFormula } from "./formula";
import { resolveDateRange, resolveDateRangeWithComparison } from "./date-ranges";

export async function executeTrendsQuery(
   db: DatabaseInstance,
   organizationId: string,
   config: TrendsConfig,
): Promise<TrendsResult> {
   const { start, end } = resolveDateRange(config.dateRange);

   // Execute each series independently
   const seriesResults = await Promise.all(
      config.series.map((s, idx) =>
         executeSeriesQuery(db, organizationId, s, config, start, end, idx),
      ),
   );

   const data = seriesResults.flat();
   const totals = computeTotals(seriesResults);

   // Formula
   let formulaData: TrendsResult["formulaData"];
   let formulaTotals: TrendsResult["formulaTotals"];
   if (config.formula) {
      formulaData = computeFormulaTimeSeries(seriesResults, config.formula, config.interval);
      const totalValues: Record<string, number> = {};
      for (const t of totals) {
         totalValues[String.fromCharCode(65 + t.seriesIndex)] = t.total;
      }
      const fTotal = evaluateFormula(config.formula, totalValues);
      formulaTotals = fTotal !== null ? { value: fTotal } : undefined;
   }

   // Comparison
   let comparison: TrendsResult["comparison"];
   if (config.compare) {
      const { previous } = resolveDateRangeWithComparison(config.dateRange);
      const prevSeriesResults = await Promise.all(
         config.series.map((s, idx) =>
            executeSeriesQuery(db, organizationId, s, config, previous.start, previous.end, idx),
         ),
      );
      const prevData = prevSeriesResults.flat();
      const prevTotals = computeTotals(prevSeriesResults);
      const percentageChanges = totals.map((current) => {
         const prev = prevTotals.find((p) => p.seriesIndex === current.seriesIndex);
         const prevVal = prev?.total ?? 0;
         const change = prevVal === 0 ? (current.total > 0 ? 100 : 0)
            : ((current.total - prevVal) / prevVal) * 100;
         return { seriesIndex: current.seriesIndex, change };
      });
      comparison = { data: prevData, totals: prevTotals, percentageChanges };
      if (config.formula) {
         comparison.formulaData = computeFormulaTimeSeries(prevSeriesResults, config.formula, config.interval);
         const prevTotalValues: Record<string, number> = {};
         for (const t of prevTotals) {
            prevTotalValues[String.fromCharCode(65 + t.seriesIndex)] = t.total;
         }
         const fPrevTotal = evaluateFormula(config.formula, prevTotalValues);
         comparison.formulaTotals = fPrevTotal !== null ? { value: fPrevTotal } : undefined;
      }
   }

   return { data, totals, formulaData, formulaTotals, comparison };
}

// --- Internal helpers ---

async function executeSeriesQuery(
   db: DatabaseInstance,
   organizationId: string,
   series: TrendsConfig["series"][number],
   config: TrendsConfig,
   start: Date,
   end: Date,
   seriesIndex: number,
): Promise<TrendsDataPoint[]> {
   const intervalExpr = sql`DATE_TRUNC(${sql.raw(`'${config.interval}'`)}, ${events.timestamp})`;

   // Build the aggregation expression based on math operation
   const aggExpr = buildAggExpression(series);

   // Build WHERE conditions
   const conditions = [
      eq(events.organizationId, organizationId),
      eq(events.eventName, series.event),
      gte(events.timestamp, start),
      lt(events.timestamp, end),
   ];

   // Add user-defined filters
   for (const filter of config.filters ?? []) {
      conditions.push(buildFilterCondition(filter));
   }

   // Build query
   const breakdownCol = config.breakdown
      ? sql`${events.properties}->>${ config.breakdown.property}`
      : sql`NULL`;

   const rows = await db
      .select({
         intervalStart: intervalExpr.as("interval_start"),
         value: aggExpr.as("value"),
         breakdownValue: breakdownCol.as("breakdown_value"),
      })
      .from(events)
      .where(and(...conditions))
      .groupBy(
         intervalExpr,
         ...(config.breakdown ? [breakdownCol] : []),
      )
      .orderBy(intervalExpr);

   return rows.map((row) => ({
      intervalStart: String(row.intervalStart),
      value: Number(row.value) || 0,
      breakdownValue: config.breakdown ? String(row.breakdownValue) : undefined,
      seriesIndex,
   }));
}

function buildAggExpression(series: TrendsConfig["series"][number]) {
   switch (series.math) {
      case "count":
         return count();
      case "unique_users":
         return countDistinct(events.userId);
      case "sum":
         return sum(sql`(${events.properties}->>${series.mathProperty ?? ""})::numeric`);
      case "avg":
         return avg(sql`(${events.properties}->>${series.mathProperty ?? ""})::numeric`);
      case "min":
         return min(sql`(${events.properties}->>${series.mathProperty ?? ""})::numeric`);
      case "max":
         return max(sql`(${events.properties}->>${series.mathProperty ?? ""})::numeric`);
   }
}

function buildFilterCondition(filter: { property: string; operator: string; value?: unknown }) {
   const prop = sql`${events.properties}->>${filter.property}`;
   switch (filter.operator) {
      case "eq": return sql`${prop} = ${String(filter.value)}`;
      case "neq": return sql`${prop} != ${String(filter.value)}`;
      case "gt": return sql`(${prop})::numeric > ${Number(filter.value)}`;
      case "lt": return sql`(${prop})::numeric < ${Number(filter.value)}`;
      case "gte": return sql`(${prop})::numeric >= ${Number(filter.value)}`;
      case "lte": return sql`(${prop})::numeric <= ${Number(filter.value)}`;
      case "contains": return sql`${prop} ILIKE ${"%" + String(filter.value) + "%"}`;
      case "not_contains": return sql`${prop} NOT ILIKE ${"%" + String(filter.value) + "%"}`;
      case "is_set": return sql`${events.properties} ? ${filter.property}`;
      case "is_not_set": return sql`NOT (${events.properties} ? ${filter.property})`;
      default: return sql`true`;
   }
}

function computeTotals(seriesResults: TrendsDataPoint[][]): Array<{ seriesIndex: number; total: number }> {
   return seriesResults.map((points, idx) => ({
      seriesIndex: idx,
      total: points.reduce((sum, p) => sum + p.value, 0),
   }));
}

function computeFormulaTimeSeries(
   seriesResults: TrendsDataPoint[][],
   formula: string,
   interval: string,
): Array<{ intervalStart: string; value: number }> {
   // Collect all unique intervals
   const allIntervals = new Set<string>();
   for (const series of seriesResults) {
      for (const point of series) {
         allIntervals.add(point.intervalStart);
      }
   }

   const sorted = [...allIntervals].sort();
   return sorted.map((intervalStart) => {
      const values: Record<string, number> = {};
      for (let i = 0; i < seriesResults.length; i++) {
         const label = String.fromCharCode(65 + i);
         const point = seriesResults[i].find((p) => p.intervalStart === intervalStart);
         values[label] = point?.value ?? 0;
      }
      const result = evaluateFormula(formula, values);
      return { intervalStart, value: result ?? 0 };
   });
}
```

**Step 2: Commit**

```
feat(analytics): implement trends query builder with formula and comparison support
```

---

### Task 5: Implement funnels query builder

**Files:**
- Create: `packages/analytics/src/funnels.ts`

**Step 1: Write `funnels.ts`**

Funnels use a CTE chain to find sequential event completion per user within a conversion window.

```typescript
import { sql } from "drizzle-orm";
import type { DatabaseInstance } from "@packages/database/client";
import type { FunnelsConfig, FunnelsResult, FunnelStepResult } from "./types";
import { resolveDateRange, resolveDateRangeWithComparison } from "./date-ranges";

export async function executeFunnelsQuery(
   db: DatabaseInstance,
   organizationId: string,
   config: FunnelsConfig,
): Promise<FunnelsResult> {
   const { start, end } = resolveDateRange(config.dateRange);

   const steps = await runFunnelQuery(db, organizationId, config, start, end);
   const overallConversion = steps.length > 1 && steps[0].count > 0
      ? (steps[steps.length - 1].count / steps[0].count) * 100
      : 0;

   let comparison: FunnelsResult["comparison"];
   if (config.compare) {
      const { previous } = resolveDateRangeWithComparison(config.dateRange);
      const prevSteps = await runFunnelQuery(db, organizationId, config, previous.start, previous.end);
      const prevOverall = prevSteps.length > 1 && prevSteps[0].count > 0
         ? (prevSteps[prevSteps.length - 1].count / prevSteps[0].count) * 100
         : 0;
      comparison = {
         steps: prevSteps,
         overallConversion: prevOverall,
         conversionChange: overallConversion - prevOverall,
      };
   }

   return { steps, overallConversion, comparison };
}

async function runFunnelQuery(
   db: DatabaseInstance,
   organizationId: string,
   config: FunnelsConfig,
   start: Date,
   end: Date,
): Promise<FunnelStepResult[]> {
   const { steps, conversionWindow } = config;

   // Build the conversion window interval expression
   const windowInterval = `${conversionWindow.value} ${conversionWindow.unit}s`;

   // Build CTE chain dynamically
   const cteFragments: string[] = [];
   const params: unknown[] = [];
   let paramIdx = 1;

   // Step 1: initial event
   cteFragments.push(`
      step_1 AS (
         SELECT DISTINCT ON (user_id) user_id, timestamp AS ts
         FROM events
         WHERE organization_id = $${paramIdx++}
           AND event_name = $${paramIdx++}
           AND timestamp >= $${paramIdx++}
           AND timestamp < $${paramIdx++}
         ORDER BY user_id, timestamp
      )
   `);
   params.push(organizationId, steps[0].event, start, end);

   // Steps 2..N: join on previous step's user within conversion window
   for (let i = 1; i < steps.length; i++) {
      const prevStep = `step_${i}`;
      const currStep = `step_${i + 1}`;
      cteFragments.push(`
         ${currStep} AS (
            SELECT DISTINCT ON (prev.user_id) prev.user_id, e.timestamp AS ts
            FROM ${prevStep} prev
            JOIN events e ON e.user_id = prev.user_id
               AND e.event_name = $${paramIdx++}
               AND e.organization_id = $${paramIdx++}
               AND e.timestamp > prev.ts
               AND e.timestamp <= prev.ts + INTERVAL '${windowInterval}'
            ORDER BY prev.user_id, e.timestamp
         )
      `);
      params.push(steps[i].event, organizationId);
   }

   // Final SELECT: count users at each step
   const selectParts = steps.map((_, i) =>
      `SELECT ${i + 1} AS step_index, COUNT(*)::int AS user_count FROM step_${i + 1}`,
   );

   const query = `
      WITH ${cteFragments.join(",\n")}
      ${selectParts.join("\n UNION ALL \n")}
      ORDER BY step_index
   `;

   const rows = await db.execute(sql.raw(query));
   // NOTE: The actual implementation will use parameterized queries via sql``.
   // The above is a conceptual outline — the real implementation builds
   // sql tagged templates with proper parameter binding.

   const results: FunnelStepResult[] = [];
   const rowArray = rows.rows as Array<{ step_index: number; user_count: number }>;

   for (let i = 0; i < steps.length; i++) {
      const row = rowArray[i];
      const userCount = row?.user_count ?? 0;
      const firstCount = rowArray[0]?.user_count ?? 0;
      const prevCount = i > 0 ? (rowArray[i - 1]?.user_count ?? 0) : userCount;

      results.push({
         stepIndex: i,
         event: steps[i].event,
         label: steps[i].label ?? steps[i].event,
         count: userCount,
         conversionFromPrevious: prevCount > 0 ? (userCount / prevCount) * 100 : 0,
         conversionFromFirst: firstCount > 0 ? (userCount / firstCount) * 100 : 0,
         dropoff: prevCount - userCount,
      });
   }

   return results;
}
```

**Important note:** The actual implementation must use Drizzle's `sql` tagged template for parameterized queries, NOT string interpolation. The pseudocode above shows the SQL structure — the implementer should build it using `sql.join()`, `sql.raw()` for safe static parts, and `sql` template parameters for user values. The conversion window interval is derived from the config enum (not user text) so it's safe to use `sql.raw()` for it.

**Step 2: Commit**

```
feat(analytics): implement funnels query builder with CTE chain
```

---

### Task 6: Implement retention query builder

**Files:**
- Create: `packages/analytics/src/retention.ts`

**Step 1: Write `retention.ts`**

Retention builds a cohort matrix: users who first did event X in period P, what % returned to do event Y in periods P+1, P+2, etc.

```typescript
import { sql } from "drizzle-orm";
import type { DatabaseInstance } from "@packages/database/client";
import type { RetentionConfig, RetentionResult, RetentionCohort } from "./types";
import { resolveDateRange, resolveDateRangeWithComparison } from "./date-ranges";

export async function executeRetentionQuery(
   db: DatabaseInstance,
   organizationId: string,
   config: RetentionConfig,
): Promise<RetentionResult> {
   const { start, end } = resolveDateRange(config.dateRange);

   const cohorts = await runRetentionQuery(db, organizationId, config, start, end);

   let comparison: RetentionResult["comparison"];
   if (config.compare) {
      const { previous } = resolveDateRangeWithComparison(config.dateRange);
      comparison = {
         cohorts: await runRetentionQuery(db, organizationId, config, previous.start, previous.end),
      };
   }

   return { cohorts, comparison };
}

async function runRetentionQuery(
   db: DatabaseInstance,
   organizationId: string,
   config: RetentionConfig,
   start: Date,
   end: Date,
): Promise<RetentionCohort[]> {
   const { startEvent, returnEvent, period, totalPeriods } = config;
   const truncUnit = period; // 'day' | 'week' | 'month'

   // The SQL computes:
   // 1. cohorts: for each user, the truncated date of their first start event
   // 2. activity: for each user, all truncated dates of their return events
   // 3. Join and compute period offset, then count distinct users per cohort/offset
   //
   // Conceptual SQL (actual uses parameterized Drizzle sql`` templates):
   //
   // WITH cohorts AS (
   //   SELECT user_id, DATE_TRUNC('week', MIN(timestamp)) AS cohort_period
   //   FROM events
   //   WHERE org = $1 AND event_name = $2 AND timestamp BETWEEN $3 AND $4
   //   GROUP BY user_id
   // ),
   // activity AS (
   //   SELECT DISTINCT c.user_id, c.cohort_period,
   //     DATE_TRUNC('week', e.timestamp) AS activity_period
   //   FROM cohorts c
   //   JOIN events e ON e.user_id = c.user_id
   //     AND e.event_name = $5 AND e.organization_id = $1
   // ),
   // retention AS (
   //   SELECT cohort_period, 
   //     EXTRACT(EPOCH FROM (activity_period - cohort_period)) / <period_seconds> AS period_offset,
   //     COUNT(DISTINCT user_id) AS retained
   //   FROM activity
   //   GROUP BY cohort_period, period_offset
   //   HAVING period_offset >= 0 AND period_offset <= $6
   // )
   // SELECT * FROM retention ORDER BY cohort_period, period_offset

   const periodSeconds = period === "day" ? 86400 : period === "week" ? 604800 : 2592000;

   const result = await db.execute(sql`
      WITH cohorts AS (
         SELECT user_id, DATE_TRUNC(${sql.raw(`'${truncUnit}'`)}, MIN(timestamp)) AS cohort_period
         FROM events
         WHERE organization_id = ${organizationId}
           AND event_name = ${startEvent.event}
           AND timestamp >= ${start}
           AND timestamp < ${end}
         GROUP BY user_id
      ),
      activity AS (
         SELECT DISTINCT c.user_id, c.cohort_period,
            DATE_TRUNC(${sql.raw(`'${truncUnit}'`)}, e.timestamp) AS activity_period
         FROM cohorts c
         JOIN events e ON e.user_id = c.user_id
            AND e.event_name = ${returnEvent.event}
            AND e.organization_id = ${organizationId}
      ),
      retention AS (
         SELECT cohort_period,
            EXTRACT(EPOCH FROM (activity_period - cohort_period))::int / ${periodSeconds} AS period_offset,
            COUNT(DISTINCT user_id)::int AS retained
         FROM activity
         GROUP BY cohort_period, period_offset
         HAVING EXTRACT(EPOCH FROM (activity_period - cohort_period))::int / ${periodSeconds} >= 0
            AND EXTRACT(EPOCH FROM (activity_period - cohort_period))::int / ${periodSeconds} <= ${totalPeriods}
      )
      SELECT cohort_period, period_offset, retained
      FROM retention
      ORDER BY cohort_period, period_offset
   `);

   // Group rows into cohorts
   const cohortMap = new Map<string, { size: number; periods: Map<number, number> }>();
   const rows = result.rows as Array<{ cohort_period: string; period_offset: number; retained: number }>;

   for (const row of rows) {
      const key = String(row.cohort_period);
      if (!cohortMap.has(key)) {
         cohortMap.set(key, { size: 0, periods: new Map() });
      }
      const cohort = cohortMap.get(key)!;
      if (row.period_offset === 0) {
         cohort.size = row.retained; // Period 0 = cohort size
      }
      cohort.periods.set(row.period_offset, row.retained);
   }

   // Convert to result format
   const cohorts: RetentionCohort[] = [];
   for (const [label, { size, periods }] of cohortMap) {
      const retentionByPeriod = [];
      for (let p = 0; p <= totalPeriods; p++) {
         const retained = periods.get(p) ?? 0;
         retentionByPeriod.push({
            period: p,
            retained,
            percentage: size > 0 ? (retained / size) * 100 : 0,
         });
      }
      cohorts.push({ cohortLabel: label, cohortSize: size, retentionByPeriod });
   }

   return cohorts;
}
```

**Step 2: Commit**

```
feat(analytics): implement retention query builder with cohort matrix
```

---

## Phase 2: New Materialized Views

### Task 7: Add analytics materialized views to database schema

**Files:**
- Modify: `packages/database/src/schemas/event-views.ts`

Add the 5 new materialized views below the existing 3 billing views. These replace the PostHog-side views.

**Step 1: Add views to `event-views.ts`**

Append after line 99 (after `currentMonthUsageByCategory`):

```typescript
// ---------------------------------------------------------------------------
// ANALYTICS VIEWS (replace PostHog-side views)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// daily_content_analytics — replaces PostHog's content_analytics_daily
// ---------------------------------------------------------------------------

export const dailyContentAnalytics = pgMaterializedView(
   "daily_content_analytics",
   {
      organizationId: uuid("organization_id").notNull(),
      contentId: text("content_id"),
      date: date("date").notNull(),
      views: integer("views").notNull(),
      uniqueVisitors: integer("unique_visitors").notNull(),
      avgTimeSpentSeconds: decimal("avg_time_spent_seconds", { precision: 10, scale: 2 }),
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
// content_traffic_sources — replaces PostHog's content_traffic_sources
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
// monthly_sdk_usage — replaces PostHog's sdk_usage_monthly
// ---------------------------------------------------------------------------

export const monthlySdkUsage = pgMaterializedView(
   "monthly_sdk_usage",
   {
      organizationId: uuid("organization_id").notNull(),
      month: date("month").notNull(),
      authorRequests: integer("author_requests").notNull(),
      listRequests: integer("list_requests").notNull(),
      contentRequests: integer("content_requests").notNull(),
      imageRequests: integer("image_requests").notNull(),
      totalRequests: integer("total_requests").notNull(),
      errors: integer("errors").notNull(),
   },
).as(sql`
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
// monthly_ai_usage — replaces PostHog's llm_usage_monthly
// ---------------------------------------------------------------------------

export const monthlyAiUsage = pgMaterializedView(
   "monthly_ai_usage",
   {
      organizationId: uuid("organization_id").notNull(),
      month: date("month").notNull(),
      completions: integer("completions").notNull(),
      chatMessages: integer("chat_messages").notNull(),
      agentActions: integer("agent_actions").notNull(),
      totalTokens: integer("total_tokens"),
      promptTokens: integer("prompt_tokens"),
      completionTokens: integer("completion_tokens"),
      avgLatencyMs: decimal("avg_latency_ms", { precision: 10, scale: 2 }),
   },
).as(sql`
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
// daily_event_counts — general-purpose trends view for custom insights
// ---------------------------------------------------------------------------

export const dailyEventCounts = pgMaterializedView(
   "daily_event_counts",
   {
      organizationId: uuid("organization_id").notNull(),
      eventName: text("event_name").notNull(),
      eventCategory: text("event_category").notNull(),
      date: date("date").notNull(),
      eventCount: integer("event_count").notNull(),
      uniqueUsers: integer("unique_users").notNull(),
   },
).as(sql`
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
```

**Step 2: Update `packages/events/src/refresh-views.ts`** to refresh all 8 views

Add the 5 new views to the imports and to the `Promise.all` in `refreshUsageViews()`.

**Step 3: Run `bun run db:push`** to create the new materialized views in the database.

**Step 4: Create unique indexes** (required for `REFRESH CONCURRENTLY`)

Run SQL migration or a script:

```sql
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_content_analytics_pk
   ON daily_content_analytics (organization_id, COALESCE(content_id, ''), date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_content_traffic_sources_pk
   ON content_traffic_sources (organization_id, COALESCE(content_id, ''), source, COALESCE(medium, ''));
CREATE UNIQUE INDEX IF NOT EXISTS idx_monthly_sdk_usage_pk
   ON monthly_sdk_usage (organization_id, month);
CREATE UNIQUE INDEX IF NOT EXISTS idx_monthly_ai_usage_pk
   ON monthly_ai_usage (organization_id, month);
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_event_counts_pk
   ON daily_event_counts (organization_id, event_name, event_category, date);
```

**Step 5: Initial refresh**

```sql
REFRESH MATERIALIZED VIEW daily_content_analytics;
REFRESH MATERIALIZED VIEW content_traffic_sources;
REFRESH MATERIALIZED VIEW monthly_sdk_usage;
REFRESH MATERIALIZED VIEW monthly_ai_usage;
REFRESH MATERIALIZED VIEW daily_event_counts;
```

**Step 6: Commit**

```
feat(database): add 5 analytics materialized views replacing PostHog queries
```

---

## Phase 3: Schema Changes & Default Dashboard

### Task 8: Add `isDefault` flag to dashboards schema

**Files:**
- Modify: `packages/database/src/schemas/dashboards.ts`

**Step 1: Add `isDefault` column**

After the `description` column (line 20), add:

```typescript
isDefault: boolean("is_default").default(false).notNull(),
```

This marks the auto-created home dashboard. Each org gets exactly one default dashboard. The home page renders this dashboard.

**Step 2: Commit**

```
feat(database): add isDefault flag to dashboards schema
```

---

### Task 9: Create default dashboard on organization creation

**Files:**
- Modify: `packages/database/src/repositories/auth-repository.ts` (line ~162)

**Step 1: Add default dashboard + insights creation**

After the team member creation (line 161) in `createDefaultOrganization()`, add logic to:

1. Create 8 default insight records (the tiles for the home dashboard)
2. Create 1 default dashboard with `isDefault: true` and tiles referencing those insights

The insights should be created with proper configs matching the `InsightConfig` types from `packages/analytics/types`:

| # | Name | Type | Config Summary | Size |
|---|------|------|----------------|------|
| 1 | Page Views | trends | `content.page.view`, count, line, 30d | lg |
| 2 | Unique Visitors | trends | `content.page.view`, unique_users, line, 30d | lg |
| 3 | Content by Status | trends | `content.created`, count, bar, this_month | sm |
| 4 | Top Content | trends | `content.page.view`, count, bar, 30d, breakdown by contentId | full |
| 5 | AI Usage | trends | 3 series (completion/chat/agent), count, line, 30d | lg |
| 6 | SDK Requests | trends | 4 series (author/list/content/image fetch), count, area, 30d | lg |
| 7 | Conversion Rate | trends | 2 series (page.view + cta.click), formula `B/A*100`, number, 30d | sm |
| 8 | Credit Usage | trends | billable events by category, count, area, this_month | full |

Import the dashboards and insights tables from the schema.

**Step 2: Commit**

```
feat(auth): create default home dashboard on organization creation
```

---

### Task 10: Add dashboard repository functions

**Files:**
- Modify: `packages/database/src/repositories/` — add or update dashboard repository

**Step 1: Add `getDefaultDashboard` function**

```typescript
export async function getDefaultDashboard(
   db: DatabaseInstance,
   organizationId: string,
): Promise<Dashboard | null> {
   const result = await db
      .select()
      .from(dashboards)
      .where(
         and(
            eq(dashboards.organizationId, organizationId),
            eq(dashboards.isDefault, true),
         ),
      )
      .limit(1);
   return result[0] ?? null;
}
```

**Step 2: Commit**

```
feat(database): add getDefaultDashboard repository function
```

---

## Phase 4: Replace PostHog Analytics Routers

### Task 11: Create new internal analytics oRPC router

**Files:**
- Create: `apps/web/src/integrations/orpc/router/analytics.ts`
- Modify: `apps/web/src/integrations/orpc/router/index.ts`

**Step 1: Create the analytics router**

This router provides a single `query` procedure that accepts any `InsightConfig` and routes to the appropriate query engine (trends/funnels/retention). This is what the insight preview and dashboard tiles call.

```typescript
import { z } from "zod";
import { insightConfigSchema } from "@packages/analytics/types";
import { executeTrendsQuery } from "@packages/analytics/trends";
import { executeFunnelsQuery } from "@packages/analytics/funnels";
import { executeRetentionQuery } from "@packages/analytics/retention";
// ... protectedProcedure, etc.

export const query = protectedProcedure
   .input(z.object({ config: insightConfigSchema }))
   .query(async ({ ctx, input }) => {
      const { db, organizationId } = await ctx;
      const { config } = input;

      switch (config.type) {
         case "trends":
            return executeTrendsQuery(db, organizationId, config);
         case "funnels":
            return executeFunnelsQuery(db, organizationId, config);
         case "retention":
            return executeRetentionQuery(db, organizationId, config);
      }
   });
```

Also add procedures for the materialized view queries (these power the default dashboard tiles for fast reads, falling back to the same result shape):

- `getContentAnalytics` — queries `dailyContentAnalytics` view
- `getTopContent` — queries `dailyContentAnalytics` aggregated by contentId
- `getTrafficSources` — queries `contentTrafficSources` view
- `getSDKUsageByMonth` — queries `monthlySdkUsage` view
- `getAIUsageByMonth` — queries `monthlyAiUsage` view
- `getDefaultDashboard` — returns the org's default dashboard with all its insight configs

**Step 2: Register in `router/index.ts`**

Add `analytics: analyticsRouter` to the router map.

**Step 3: Commit**

```
feat(api): add internal analytics router replacing PostHog queries
```

---

### Task 12: Rewire content-analytics router to use internal queries

**Files:**
- Modify: `apps/web/src/integrations/orpc/router/content-analytics.ts`

**Step 1: Replace PostHog imports with internal view queries**

Replace all `queryContentAnalytics()`, `queryTopContent()`, `queryTrafficSources()`, `queryEngagementFunnel()` calls from `@packages/posthog/analytics/content-analytics-query` with Drizzle queries against the new materialized views (`dailyContentAnalytics`, `contentTrafficSources`).

For `getEngagementFunnel`, use the funnels query engine from `@packages/analytics/funnels` with a pre-configured funnel (page.view → scroll.milestone → cta.click → form.conversion).

**Step 2: Commit**

```
refactor(api): replace PostHog content analytics with internal queries
```

---

### Task 13: Rewire usage router to use internal queries

**Files:**
- Modify: `apps/web/src/integrations/orpc/router/usage.ts`

**Step 1: Replace PostHog AI usage queries**

Replace `queryAIUsage()` and `queryExtendedUsage()` from `@packages/posthog/analytics/usage-query` with Drizzle queries against `monthlyAiUsage` and `dailyEventCounts` views.

**Step 2: Commit**

```
refactor(api): replace PostHog AI usage with internal queries
```

---

### Task 14: Rewire SDK usage router to use internal queries

**Files:**
- Modify: `apps/web/src/integrations/orpc/router/sdk-usage.ts`

**Step 1: Replace PostHog SDK usage queries**

Replace `querySDKUsage()` and `querySDKUsageByMonth()` from `@packages/posthog/analytics/sdk-usage-query` with Drizzle queries against `monthlySdkUsage` view.

**Step 2: Commit**

```
refactor(api): replace PostHog SDK usage with internal queries
```

---

## Phase 5: Dashboard UI

### Task 15: Update the `useInsightConfig` hook with new types

**Files:**
- Modify: `apps/web/src/features/analytics/hooks/use-insight-config.ts`

**Step 1: Replace local config types with shared schemas**

Replace the local `TrendsConfig`, `FunnelsConfig`, `RetentionConfig` types with imports from `@packages/analytics/types`. Update default configs to match the new schema shape (add `dateRange` as an object, `series` array format, etc.).

**Step 2: Commit**

```
refactor(dashboard): use shared analytics types in insight config hook
```

---

### Task 16: Update query builders to use new config shapes

**Files:**
- Modify: `apps/web/src/features/analytics/ui/trends-query-builder.tsx`
- Modify: `apps/web/src/features/analytics/ui/funnels-query-builder.tsx`
- Modify: `apps/web/src/features/analytics/ui/retention-query-builder.tsx`

**Step 1: Update TrendsQueryBuilder**

- Add formula input field
- Add comparison toggle
- Update series to support `math` operation selector (count/sum/avg/min/max/unique_users)
- Update date range to support both relative and absolute
- Add interval selector (hour/day/week/month)

**Step 2: Update FunnelsQueryBuilder**

- Add conversion window unit selector (minute/hour/day/week)
- Add exclusion step support
- Add comparison toggle

**Step 3: Update RetentionQueryBuilder**

- Add filters for start/return events
- Add totalPeriods selector
- Add comparison toggle

**Step 4: Commit**

```
feat(dashboard): update query builders for full analytics config support
```

---

### Task 17: Update InsightPreview to fetch real data

**Files:**
- Modify: `apps/web/src/features/analytics/ui/insight-preview.tsx`

**Step 1: Replace sample data with real oRPC query**

Instead of rendering random sample data, call `orpc.analytics.query` with the current config and render the real results. Use TanStack Query with the config as the query key (debounced via the hook).

Handle loading, error, and empty states.

For trends with comparison, overlay the previous-period line with reduced opacity.

For trends with formula, show the formula result as an additional line/number.

**Step 2: Commit**

```
feat(dashboard): connect insight preview to real analytics query engine
```

---

### Task 18: Update DashboardTile to render real insights

**Files:**
- Modify: `apps/web/src/features/analytics/ui/dashboard-tile.tsx`

**Step 1: Fetch insight data per tile**

Each tile has an `insightId`. Fetch the insight's config from the insights table, then call `orpc.analytics.query` with that config. Render the appropriate chart based on the insight type and chartType.

Show percentage change badges when comparison data is available.

**Step 2: Commit**

```
feat(dashboard): render real data in dashboard tiles
```

---

### Task 19: Add formula and comparison display to chart components

**Files:**
- Modify: `apps/web/src/features/analytics/charts/trends-line-chart.tsx`
- Modify: `apps/web/src/features/analytics/charts/trends-bar-chart.tsx`
- Modify: `apps/web/src/features/analytics/charts/trends-number-card.tsx`
- Modify: `apps/web/src/features/analytics/charts/funnel-chart.tsx`
- Modify: `apps/web/src/features/analytics/charts/retention-grid.tsx`

**Step 1: Add comparison overlay to line/bar charts**

Add dashed lines for previous-period data with reduced opacity. Use the same colors but with 40% opacity for comparison series.

**Step 2: Add percentage change badges to number cards**

Show "+12.5%" or "-3.2%" with green/red coloring based on the `comparison.percentageChanges` data.

**Step 3: Add comparison columns to funnel chart**

Show previous-period conversion rates alongside current ones.

**Step 4: Commit**

```
feat(dashboard): add comparison and formula display to all chart types
```

---

## Phase 6: Home Page → Default Dashboard

### Task 20: Replace home page with default dashboard renderer

**Files:**
- Modify: `apps/web/src/routes/_authenticated/$slug/$teamId/_dashboard/home/index.tsx`
- Potentially remove: `.../_components/home-sdk-usage-card.tsx`
- Potentially remove: `.../_components/home-content-analytics-card.tsx`

**Step 1: Rewrite the home page route**

The home page should:

1. Fetch the org's default dashboard via `orpc.analytics.getDefaultDashboard` (or `orpc.dashboards.getDefault`)
2. If no default dashboard exists (legacy org), create one on the fly via a mutation
3. Render the `DashboardGrid` with the dashboard's tiles
4. Keep the `QuickStartChecklist` above the dashboard (if not dismissed)
5. Add "Customize" button that links to the full dashboard editor for this dashboard

The page should look like PostHog's home: a grid of insight tiles that users can rearrange.

**Step 2: Remove old hardcoded home components**

The `HomeSDKUsageCard`, `HomeContentAnalyticsCard` components become unnecessary — their functionality is now covered by individual insight tiles on the dashboard. Keep `HomeContentStatsCard` and `HomeRecentContentSection` only if they provide value that can't be replicated by insights (content status counts from the content table, not events).

OR: Convert them into insight tiles with special "non-event" data sources (content count by status is a DB query, not an event query). This is a design choice.

**Step 3: Commit**

```
feat(dashboard): replace hardcoded home page with customizable default dashboard
```

---

### Task 21: Add "customize dashboard" inline editing

**Files:**
- Modify: `apps/web/src/features/analytics/ui/dashboard-grid.tsx`

**Step 1: Add edit mode to DashboardGrid**

When in edit mode:
- Tiles show drag handles and resize handles
- An "Add tile" button appears at the bottom
- "Add tile" opens a sheet/credenza to pick an existing insight or create a new one
- "Done editing" button saves the tile layout via `orpc.dashboards.updateTiles`

The dashboard grid already uses `@dnd-kit` for drag-reorder — extend it with resize support (changing the `size` prop of tiles).

**Step 2: Commit**

```
feat(dashboard): add inline dashboard editing with tile add/remove/resize
```

---

## Phase 7: Cleanup

### Task 22: Remove PostHog analytics query modules

**Files:**
- Remove or deprecate: `packages/posthog/src/analytics/usage-query.ts`
- Remove or deprecate: `packages/posthog/src/analytics/sdk-usage-query.ts`
- Remove or deprecate: `packages/posthog/src/analytics/content-analytics-query.ts`

**Step 1: Delete or empty the PostHog analytics query files**

These are no longer called by any router. The PostHog package still stays for:
- Feature flags (`isFeatureEnabled`, `getFeatureFlag`, etc.)
- Session recording (auto-capture in client)
- Surveys
- Early access features
- User identification/grouping
- Error capture (`captureError`)
- LLM analytics (server + client capture — these are still sent to PostHog for now)

Only the HogQL query functions are removed. The `emitEvent()` dual-write to PostHog can also stay for now as a backup/secondary sink.

**Step 2: Remove the `./analytics/*` export from `packages/posthog/package.json`** if no consumers remain.

**Step 3: Commit**

```
refactor(posthog): remove analytics query modules replaced by internal engine
```

---

### Task 23: Update worker refresh and verify end-to-end

**Files:**
- Verify: `packages/events/src/refresh-views.ts` (already updated in Task 7)
- Verify: `apps/worker/src/scheduler.ts` (no changes needed — it calls `refreshUsageViews`)

**Step 1: Run `bun run typecheck`** across the workspace

**Step 2: Run `bun run check`** for lint/format

**Step 3: Run `bun run build`** to verify everything compiles

**Step 4: Manual test:**
- Start dev environment (`bun dev`)
- Navigate to home page — should show the default dashboard with real data
- Navigate to analytics → insights → create new insight — should show real data in preview
- Navigate to analytics → dashboards — should list the default dashboard
- Click into the default dashboard — should render tiles with real data
- Try edit mode — drag/reorder/resize tiles

**Step 5: Commit**

```
chore: verify analytics system integration end-to-end
```

---

## File Changes Summary

### New Files

| File | Description |
|------|-------------|
| `packages/analytics/package.json` | Package manifest |
| `packages/analytics/tsconfig.json` | TypeScript config |
| `packages/analytics/src/types.ts` | Shared Zod schemas and result types |
| `packages/analytics/src/date-ranges.ts` | Date range resolution |
| `packages/analytics/src/formula.ts` | Formula evaluator |
| `packages/analytics/src/trends.ts` | Trends SQL query builder |
| `packages/analytics/src/funnels.ts` | Funnels CTE query builder |
| `packages/analytics/src/retention.ts` | Retention cohort query builder |
| `packages/analytics/src/default-dashboard.ts` | Default dashboard insight configs |
| `apps/web/src/integrations/orpc/router/analytics.ts` | Internal analytics oRPC router |

### Modified Files

| File | Change |
|------|--------|
| `packages/database/src/schemas/event-views.ts` | Add 5 materialized views |
| `packages/database/src/schemas/dashboards.ts` | Add `isDefault` boolean column |
| `packages/events/src/refresh-views.ts` | Refresh 8 views instead of 3 |
| `packages/database/src/repositories/auth-repository.ts` | Create default dashboard on org creation |
| `apps/web/src/integrations/orpc/router/index.ts` | Register analytics router |
| `apps/web/src/integrations/orpc/router/content-analytics.ts` | Replace PostHog with internal queries |
| `apps/web/src/integrations/orpc/router/usage.ts` | Replace PostHog with internal queries |
| `apps/web/src/integrations/orpc/router/sdk-usage.ts` | Replace PostHog with internal queries |
| `apps/web/src/features/analytics/hooks/use-insight-config.ts` | Use shared analytics types |
| `apps/web/src/features/analytics/ui/trends-query-builder.tsx` | Formula, comparison, math ops, interval |
| `apps/web/src/features/analytics/ui/funnels-query-builder.tsx` | Conversion window units, exclusions |
| `apps/web/src/features/analytics/ui/retention-query-builder.tsx` | Filters, total periods, comparison |
| `apps/web/src/features/analytics/ui/insight-preview.tsx` | Real data from analytics router |
| `apps/web/src/features/analytics/ui/dashboard-tile.tsx` | Real data rendering |
| `apps/web/src/features/analytics/ui/dashboard-grid.tsx` | Edit mode with add/resize |
| `apps/web/src/features/analytics/charts/trends-line-chart.tsx` | Comparison overlay |
| `apps/web/src/features/analytics/charts/trends-bar-chart.tsx` | Comparison overlay |
| `apps/web/src/features/analytics/charts/trends-number-card.tsx` | Percentage change badge |
| `apps/web/src/features/analytics/charts/funnel-chart.tsx` | Comparison columns |
| `apps/web/src/features/analytics/charts/retention-grid.tsx` | Comparison rows |
| `apps/web/src/routes/.../_dashboard/home/index.tsx` | Default dashboard renderer |

### Removed/Deprecated Files

| File | Reason |
|------|--------|
| `packages/posthog/src/analytics/usage-query.ts` | Replaced by internal queries |
| `packages/posthog/src/analytics/sdk-usage-query.ts` | Replaced by internal queries |
| `packages/posthog/src/analytics/content-analytics-query.ts` | Replaced by internal queries |
| `apps/web/.../_components/home-sdk-usage-card.tsx` | Replaced by dashboard tiles |
| `apps/web/.../_components/home-content-analytics-card.tsx` | Replaced by dashboard tiles |

---

## Implementation Order & Dependencies

```
Phase 1 (Query Engine)     Phase 2 (Views)        Phase 3 (Schema)
T1 → T2 → T3 → T4 ──┐    T7 ──────────────┐     T8 → T9 → T10
              → T5 ──┤                     │
              → T6 ──┘                     │
                      │                     │
                      ▼                     ▼
                Phase 4 (Router Rewiring)
                T11 → T12
                    → T13
                    → T14
                      │
                      ▼
                Phase 5 (Dashboard UI)
                T15 → T16 → T17 → T18 → T19
                      │
                      ▼
                Phase 6 (Home Page)
                T20 → T21
                      │
                      ▼
                Phase 7 (Cleanup)
                T22 → T23
```

**Parallelizable:** Phase 1 Tasks 4/5/6 can run in parallel after Task 3. Phase 2 (Task 7) can run in parallel with Phase 1. Phase 3 (Tasks 8-10) can run in parallel with Phases 1 & 2.
