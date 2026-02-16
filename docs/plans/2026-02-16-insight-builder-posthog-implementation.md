# Insight Builder PostHog-Style Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the insight builder page to match PostHog's layout — full-width query card for Trends, sidebar for Funnels/Retention, filter bar with chart type selector, status line, and detailed results table.

**Architecture:** The current `InsightBuilder` (178 lines, 2-column sidebar layout for all types) is replaced with a type-aware layout. New extracted components handle header, filter bar, status line, and results table. Query builders have their date/interval/chartType controls extracted to a shared filter bar. The `useInsightConfig` hook and all chart components remain unchanged.

**Tech Stack:** React, TanStack Router, TanStack Query, oRPC, Recharts, Radix UI (shadcn), Tailwind CSS

---

## Task 1: Create InsightHeader Component

**Files:**
- Create: `apps/web/src/features/analytics/ui/insight-header.tsx`

**What:** PostHog-style header with back link, type emoji, inline-editable title/description, Save button, and "..." menu.

**Step 1: Create the component**

```tsx
// insight-header.tsx
import { Button } from "@packages/ui/components/button";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
} from "@packages/ui/components/dropdown-menu";
import { Link } from "@tanstack/react-router";
import {
   ArrowLeft,
   Copy,
   Ellipsis,
   Loader2,
   Save,
   Trash2,
} from "lucide-react";
import type { InsightType } from "@/features/analytics/hooks/use-insight-config";
import { InlineEditableText } from "./inline-editable-text";

const TYPE_EMOJI: Record<InsightType, string> = {
   trends: "📈",
   funnels: "📊",
   retention: "🔄",
};

interface InsightHeaderProps {
   name: string;
   description: string;
   type: InsightType;
   onNameChange: (name: string) => void;
   onDescriptionChange: (description: string) => void;
   onSave: () => void;
   isSaving: boolean;
   onDuplicate?: () => void;
   onDelete?: () => void;
   backTo: { slug: string; teamSlug: string };
}

export function InsightHeader({
   name,
   description,
   type,
   onNameChange,
   onDescriptionChange,
   onSave,
   isSaving,
   onDuplicate,
   onDelete,
   backTo,
}: InsightHeaderProps) {
   return (
      <div className="flex flex-col gap-0">
         {/* Title row */}
         <div className="flex items-center justify-between gap-4 pb-1">
            <div className="flex items-center gap-2 min-w-0 flex-1">
               <Link
                  params={backTo as never}
                  to="/$slug/$teamSlug/analytics/insights"
               >
                  <Button className="size-7" size="icon" variant="ghost">
                     <ArrowLeft className="size-4" />
                  </Button>
               </Link>
               <span className="text-lg shrink-0">{TYPE_EMOJI[type]}</span>
               <InlineEditableText
                  className="text-lg font-semibold tracking-tight"
                  onSave={onNameChange}
                  placeholder="Nome do insight"
                  value={name}
               />
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
               <Button disabled={isSaving} onClick={onSave} size="sm">
                  {isSaving ? (
                     <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                     <Save className="size-3.5" />
                  )}
                  Salvar
               </Button>
               {(onDuplicate || onDelete) && (
                  <DropdownMenu>
                     <DropdownMenuTrigger asChild>
                        <Button className="size-8" size="icon" variant="ghost">
                           <Ellipsis className="size-4" />
                        </Button>
                     </DropdownMenuTrigger>
                     <DropdownMenuContent align="end">
                        {onDuplicate && (
                           <DropdownMenuItem onClick={onDuplicate}>
                              <Copy className="mr-2 size-4" />
                              Duplicar insight
                           </DropdownMenuItem>
                        )}
                        {onDelete && (
                           <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                 className="text-destructive focus:text-destructive"
                                 onClick={onDelete}
                              >
                                 <Trash2 className="mr-2 size-4" />
                                 Deletar insight
                              </DropdownMenuItem>
                           </>
                        )}
                     </DropdownMenuContent>
                  </DropdownMenu>
               )}
            </div>
         </div>
         {/* Description */}
         <div className="pl-[68px] pb-3">
            <InlineEditableText
               className="text-sm text-muted-foreground"
               onSave={onDescriptionChange}
               placeholder="Adicionar descrição (opcional)"
               value={description}
            />
         </div>
      </div>
   );
}
```

**Step 2: Commit**
```bash
git add apps/web/src/features/analytics/ui/insight-header.tsx
git commit -m "feat(analytics): add InsightHeader component with inline editing and menu"
```

---

## Task 2: Create InsightFilterBar Component

**Files:**
- Create: `apps/web/src/features/analytics/ui/insight-filter-bar.tsx`

**What:** PostHog-style filter bar with date range, interval, comparison toggle, and chart type selector. Content varies by insight type.

**Step 1: Create the component**

```tsx
// insight-filter-bar.tsx
import { Button } from "@packages/ui/components/button";
import {
   Popover,
   PopoverContent,
   PopoverTrigger,
} from "@packages/ui/components/popover";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@packages/ui/components/select";
import { cn } from "@packages/ui/lib/utils";
import {
   BarChart3,
   Calendar,
   GitCompareArrows,
   LineChart,
   ScatterChart,
   Hash,
} from "lucide-react";
import type { InsightType } from "@/features/analytics/hooks/use-insight-config";

// Date range presets shared across types
const DATE_RANGE_PRESETS = [
   { value: "7d", label: "Últimos 7 dias" },
   { value: "14d", label: "Últimos 14 dias" },
   { value: "30d", label: "Últimos 30 dias" },
   { value: "90d", label: "Últimos 90 dias" },
   { value: "180d", label: "Últimos 180 dias" },
   { value: "12m", label: "Últimos 12 meses" },
   { value: "this_month", label: "Este mês" },
   { value: "last_month", label: "Mês passado" },
   { value: "this_quarter", label: "Este trimestre" },
   { value: "this_year", label: "Este ano" },
] as const;

const INTERVAL_OPTIONS = [
   { value: "hour", label: "hora" },
   { value: "day", label: "dia" },
   { value: "week", label: "semana" },
   { value: "month", label: "mês" },
] as const;

const CHART_TYPES = [
   { value: "line", label: "Linha", icon: LineChart },
   { value: "bar", label: "Barras", icon: BarChart3 },
   { value: "area", label: "Área", icon: ScatterChart },
   { value: "number", label: "Número", icon: Hash },
] as const;

interface InsightFilterBarProps {
   type: InsightType;
   dateRange: string;
   onDateRangeChange: (value: string) => void;
   // Trends-specific
   interval?: string;
   onIntervalChange?: (value: string) => void;
   chartType?: string;
   onChartTypeChange?: (value: string) => void;
   compare?: boolean;
   onCompareChange?: (value: boolean) => void;
}

export function InsightFilterBar({
   type,
   dateRange,
   onDateRangeChange,
   interval,
   onIntervalChange,
   chartType,
   onChartTypeChange,
   compare,
   onCompareChange,
}: InsightFilterBarProps) {
   const dateLabel =
      DATE_RANGE_PRESETS.find((p) => p.value === dateRange)?.label ?? dateRange;

   const ChartIcon =
      CHART_TYPES.find((c) => c.value === chartType)?.icon ?? LineChart;
   const chartLabel =
      CHART_TYPES.find((c) => c.value === chartType)?.label ?? "Linha";

   return (
      <div className="flex items-center justify-between gap-3 border-t border-b py-2">
         <div className="flex items-center gap-1.5 flex-wrap">
            {/* Date range */}
            <Popover>
               <PopoverTrigger asChild>
                  <Button className="h-7 text-xs gap-1.5" size="sm" variant="outline">
                     <Calendar className="size-3.5" />
                     {dateLabel}
                  </Button>
               </PopoverTrigger>
               <PopoverContent align="start" className="w-56 p-2">
                  <div className="flex flex-col gap-1">
                     {DATE_RANGE_PRESETS.map((preset) => (
                        <Button
                           className="justify-start"
                           key={preset.value}
                           onClick={() => onDateRangeChange(preset.value)}
                           size="sm"
                           variant={dateRange === preset.value ? "secondary" : "ghost"}
                        >
                           {preset.label}
                        </Button>
                     ))}
                  </div>
               </PopoverContent>
            </Popover>

            {/* Interval (Trends only) */}
            {type === "trends" && interval && onIntervalChange && (
               <>
                  <span className="text-xs text-muted-foreground">agrupado por</span>
                  <Select onValueChange={onIntervalChange} value={interval}>
                     <SelectTrigger className="h-7 w-auto text-xs gap-1 px-2">
                        <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                        {INTERVAL_OPTIONS.map((opt) => (
                           <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                           </SelectItem>
                        ))}
                     </SelectContent>
                  </Select>
               </>
            )}

            {/* Compare (Trends only) */}
            {type === "trends" && onCompareChange !== undefined && (
               <Button
                  className={cn(
                     "h-7 text-xs gap-1.5",
                     compare ? "text-foreground" : "text-muted-foreground",
                  )}
                  onClick={() => onCompareChange?.(!compare)}
                  size="sm"
                  variant="outline"
               >
                  <GitCompareArrows className="size-3.5" />
                  {compare ? "Comparando períodos" : "Sem comparação"}
               </Button>
            )}
         </div>

         <div className="flex items-center gap-1.5">
            {/* Chart type (Trends only) */}
            {type === "trends" && chartType && onChartTypeChange && (
               <Select onValueChange={onChartTypeChange} value={chartType}>
                  <SelectTrigger className="h-7 w-auto text-xs gap-1.5 px-2">
                     <ChartIcon className="size-3.5" />
                     <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                     {CHART_TYPES.map((ct) => (
                        <SelectItem key={ct.value} value={ct.value}>
                           <div className="flex items-center gap-2">
                              <ct.icon className="size-3.5" />
                              {ct.label}
                           </div>
                        </SelectItem>
                     ))}
                  </SelectContent>
               </Select>
            )}
         </div>
      </div>
   );
}
```

**Step 2: Commit**
```bash
git add apps/web/src/features/analytics/ui/insight-filter-bar.tsx
git commit -m "feat(analytics): add InsightFilterBar with date range, interval, compare, chart type"
```

---

## Task 3: Create InsightStatusLine Component

**Files:**
- Create: `apps/web/src/features/analytics/ui/insight-status-line.tsx`

**What:** "Computado há X • Atualizar" line between filter bar and chart.

**Step 1: Create the component**

Reuse `formatLastComputed` from `dashboard-tile.tsx` — or inline it since it's small.

```tsx
// insight-status-line.tsx
interface InsightStatusLineProps {
   lastComputedAt?: Date | null;
   onRefresh: () => void;
   isRefreshing?: boolean;
}

function formatRelative(date: Date): string {
   const diffMs = Date.now() - date.getTime();
   const diffMin = Math.floor(diffMs / 60000);
   if (diffMin < 1) return "agora";
   if (diffMin < 60) return `há ${diffMin}min`;
   const diffH = Math.floor(diffMin / 60);
   if (diffH < 24) return `há ${diffH}h`;
   return `há ${Math.floor(diffH / 24)}d`;
}

export function InsightStatusLine({
   lastComputedAt,
   onRefresh,
   isRefreshing = false,
}: InsightStatusLineProps) {
   return (
      <p className="text-xs text-muted-foreground py-1.5">
         {lastComputedAt && (
            <span>Computado {formatRelative(new Date(lastComputedAt))}</span>
         )}
         {lastComputedAt && " • "}
         <button
            className="text-primary hover:underline disabled:opacity-50"
            disabled={isRefreshing}
            onClick={onRefresh}
            type="button"
         >
            {isRefreshing ? "Atualizando..." : "Atualizar"}
         </button>
      </p>
   );
}
```

**Step 2: Commit**
```bash
git add apps/web/src/features/analytics/ui/insight-status-line.tsx
git commit -m "feat(analytics): add InsightStatusLine component"
```

---

## Task 4: Refactor TrendsQueryBuilder — Extract Controls, Horizontal Layout

**Files:**
- Modify: `apps/web/src/features/analytics/ui/trends-query-builder.tsx`

**What:** Remove date range, interval, chart type, and compare controls from the builder (they move to InsightFilterBar). Change layout from vertical sidebar to horizontal full-width card. Keep series management, formula, and event selection.

**Step 1: Remove these sections from TrendsQueryBuilder**

Remove from the component's render output:
- The chart type `<Select>` (labeled "Tipo de gráfico")
- The date range `<Select>` (labeled "Período")
- The interval `<Select>` (labeled "Intervalo")
- The compare `<Switch>` (labeled "Comparar com período anterior")

These are now controlled externally via `InsightFilterBar`.

**Step 2: Change the layout from vertical stack to horizontal card**

The builder becomes a bordered card with:
- Left side: Series section (event + math selectors, add series button)
- Right side: Formula toggle (collapsible via "Opções avançadas")
- Full-width horizontal layout instead of narrow 320px sidebar

Key changes to the JSX:
- Wrap in a `div` with `rounded-lg border bg-card p-4`
- Use `flex` row layout instead of vertical `space-y-6`
- Series list on the left (`flex-1`), advanced options collapsible at bottom

**Step 3: Commit**
```bash
git add apps/web/src/features/analytics/ui/trends-query-builder.tsx
git commit -m "refactor(analytics): extract controls from TrendsQueryBuilder to filter bar, horizontal layout"
```

---

## Task 5: Refactor FunnelsQueryBuilder — Extract Date Range

**Files:**
- Modify: `apps/web/src/features/analytics/ui/funnels-query-builder.tsx`

**What:** Remove the date range and compare controls (they move to InsightFilterBar). The builder keeps its sidebar form layout for steps, conversion window, etc.

**Step 1: Remove these sections**

Remove:
- Date range `<Select>` (labeled "Período")
- Compare `<Switch>` (labeled "Comparar com período anterior")

**Step 2: Commit**
```bash
git add apps/web/src/features/analytics/ui/funnels-query-builder.tsx
git commit -m "refactor(analytics): extract date range from FunnelsQueryBuilder"
```

---

## Task 6: Refactor RetentionQueryBuilder — Extract Date Range

**Files:**
- Modify: `apps/web/src/features/analytics/ui/retention-query-builder.tsx`

**What:** Same as funnels — remove date range and compare controls.

**Step 1: Remove these sections**

Remove:
- Date range `<Select>` (labeled "Período")
- Compare `<Switch>` (labeled "Comparar com período anterior")

**Step 2: Commit**
```bash
git add apps/web/src/features/analytics/ui/retention-query-builder.tsx
git commit -m "refactor(analytics): extract date range from RetentionQueryBuilder"
```

---

## Task 7: Rewrite InsightBuilder — Type-Aware Layout

**Files:**
- Modify: `apps/web/src/features/analytics/ui/insight-builder.tsx`

**What:** Complete rewrite. The builder now uses:
- `InsightHeader` at top
- Type tabs
- Type-specific layout (full-width card for Trends, sidebar for Funnels/Retention)
- `InsightFilterBar` between builder and chart
- `InsightStatusLine` before chart
- `InsightPreview` for chart
- `TrendsResultsTable` below chart (Trends only)

**Step 1: Rewrite the component**

New props interface (changes from current):
- Remove `heading` (replaced by InsightHeader)
- Add `onDuplicate?: () => void`
- Add `onDelete?: () => void`
- Add `backTo: { slug: string; teamSlug: string }`
- Add `lastComputedAt?: Date | null`
- Add `onRefresh: () => void`
- Add `isRefreshing?: boolean`
- Add `queryResult?: TrendsResult | FunnelsResult | RetentionResult` (for results table)

Layout logic:
```tsx
// Trends layout — full width
if (type === "trends") {
   return (
      <>
         <InsightHeader ... />
         <InsightTypeTabs ... />
         <TrendsQueryBuilder ... />  {/* full-width card */}
         <InsightFilterBar type="trends" dateRange={...} interval={...} chartType={...} ... />
         <InsightStatusLine ... />
         <InsightPreview config={config} />
         <TrendsResultsTable ... />
      </>
   );
}

// Funnels/Retention layout — sidebar
return (
   <>
      <InsightHeader ... />
      <InsightTypeTabs ... />
      <div className="flex gap-4">
         <div className="w-[400px] shrink-0">
            {type === "funnels" ? <FunnelsQueryBuilder ... /> : <RetentionQueryBuilder ... />}
         </div>
         <div className="flex-1 min-w-0 flex flex-col gap-0">
            <InsightFilterBar type={type} dateRange={...} ... />
            <InsightStatusLine ... />
            <InsightPreview config={config} />
         </div>
      </div>
   </>
);
```

**Step 2: Extract tab bar to inline component or reuse existing**

The tab bar uses inline buttons styled as tabs:
```tsx
const INSIGHT_TABS: { value: InsightType; label: string }[] = [
   { value: "trends", label: "Tendências" },
   { value: "funnels", label: "Funis" },
   { value: "retention", label: "Retenção" },
];
```

**Step 3: Wire up filter bar props from config**

The filter bar reads from `config` and writes via `onConfigUpdate`:
```tsx
// For trends:
dateRange={config.type === "trends" ? config.dateRange.value : "30d"}
onDateRangeChange={(v) => onConfigUpdate({ dateRange: { type: "relative", value: v } })}
interval={config.type === "trends" ? config.interval : undefined}
onIntervalChange={(v) => onConfigUpdate({ interval: v })}
chartType={config.type === "trends" ? config.chartType : undefined}
onChartTypeChange={(v) => onConfigUpdate({ chartType: v })}
compare={config.compare}
onCompareChange={(v) => onConfigUpdate({ compare: v })}
```

**Step 4: Commit**
```bash
git add apps/web/src/features/analytics/ui/insight-builder.tsx
git commit -m "feat(analytics): rewrite InsightBuilder with PostHog-style type-aware layout"
```

---

## Task 8: Create TrendsResultsTable Component

**Files:**
- Create: `apps/web/src/features/analytics/ui/trends-results-table.tsx`

**What:** "Detailed results" table below the Trends chart showing series data per date.

**Step 1: Create the component**

Uses the same data that `InsightPreview` uses. Accepts the query result and config.

```tsx
// trends-results-table.tsx
import type { TrendsConfig, TrendsResult } from "@packages/analytics/types";

interface TrendsResultsTableProps {
   result: TrendsResult;
   config: TrendsConfig;
}

export function TrendsResultsTable({ result, config }: TrendsResultsTableProps) {
   if (!result.data || result.data.length === 0) return null;

   // Get unique dates from data
   const dates = [...new Set(result.data.map((d) => d.intervalStart))].sort();
   const CHART_COLORS = [
      "var(--chart-1)", "var(--chart-2)", "var(--chart-3)",
      "var(--chart-4)", "var(--chart-5)", "var(--chart-6)",
   ];

   // Group data by series
   const seriesData = config.series.map((series, idx) => {
      const points = result.data.filter((d) => d.seriesIndex === idx);
      const total = result.totals?.find((t) => t.seriesIndex === idx)?.total ?? 0;
      const byDate = new Map(points.map((p) => [p.intervalStart, p.count]));
      return {
         label: series.label || series.event,
         color: CHART_COLORS[idx % CHART_COLORS.length],
         total,
         byDate,
      };
   });

   const formatDate = (d: string) =>
      new Date(d).toLocaleDateString("pt-BR", { day: "numeric", month: "short" });

   return (
      <div className="rounded-lg border">
         <div className="flex items-center justify-between px-4 py-3 border-b">
            <h3 className="text-sm font-semibold">Resultados detalhados</h3>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-xs">
               <thead>
                  <tr className="border-b bg-muted/50">
                     <th className="text-left px-4 py-2 font-medium">SERIES</th>
                     <th className="text-left px-3 py-2 font-medium">COR</th>
                     <th className="text-right px-3 py-2 font-medium">TOTAL</th>
                     {dates.map((d) => (
                        <th className="text-right px-3 py-2 font-medium whitespace-nowrap" key={d}>
                           {formatDate(d).toUpperCase()}
                        </th>
                     ))}
                  </tr>
               </thead>
               <tbody>
                  {seriesData.map((s, i) => (
                     <tr className="border-b last:border-0" key={`series-${i + 1}`}>
                        <td className="px-4 py-2 font-medium truncate max-w-[200px]">
                           {s.label}
                        </td>
                        <td className="px-3 py-2">
                           <div
                              className="size-3 rounded-full"
                              style={{ backgroundColor: s.color }}
                           />
                        </td>
                        <td className="text-right px-3 py-2 font-semibold">{s.total}</td>
                        {dates.map((d) => (
                           <td className="text-right px-3 py-2 tabular-nums" key={d}>
                              {s.byDate.get(d) ?? 0}
                           </td>
                        ))}
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
   );
}
```

**Step 2: Commit**
```bash
git add apps/web/src/features/analytics/ui/trends-results-table.tsx
git commit -m "feat(analytics): add TrendsResultsTable for detailed series data"
```

---

## Task 9: Update Route Files

**Files:**
- Modify: `apps/web/src/routes/_authenticated/$slug/$teamSlug/_dashboard/analytics/insights/$insightId.tsx`
- Modify: `apps/web/src/routes/_authenticated/$slug/$teamSlug/_dashboard/analytics/insights/new.tsx`

**What:** Update both routes to pass new props to `InsightBuilder` (remove `heading`, `disableTypeSwitch`; add `backTo`, `onDuplicate`, `onDelete`, `onRefresh`, `lastComputedAt`).

**Step 1: Update $insightId.tsx**

Key changes:
- Remove `disableTypeSwitch={true}` — tabs now always allow switching
- Remove `heading="Editar insight"` — header is now inside the builder
- Add `backTo={{ slug, teamSlug }}` from route params
- Add `onDelete` handler with confirmation dialog + `insights.remove` mutation
- Add `onDuplicate` handler with `insights.create` mutation (copy config + name)
- Add `lastComputedAt={insight.lastComputedAt}`
- Add `onRefresh` to invalidate analytics query cache
- Pass `queryResult` from a parallel query for the results table

**Step 2: Update new.tsx**

Key changes:
- Remove `heading="Novo insight"`
- Add `backTo={{ slug, teamSlug }}` from route params
- No `onDelete` or `onDuplicate` (new insight, not saved yet)
- No `lastComputedAt` (new insight)

**Step 3: Commit**
```bash
git add apps/web/src/routes/_authenticated/$slug/$teamSlug/_dashboard/analytics/insights/$insightId.tsx
git add apps/web/src/routes/_authenticated/$slug/$teamSlug/_dashboard/analytics/insights/new.tsx
git commit -m "feat(analytics): update insight routes for PostHog-style builder"
```

---

## Task 10: Integration Testing & Polish

**Step 1: Run typecheck**
```bash
bun run typecheck
```
Expected: PASS (fix any type errors)

**Step 2: Run dev server and manually test**
```bash
bun dev
```

Verify:
1. `/analytics/insights/new` — Trends shows full-width query card
2. Switch to Funis tab — layout changes to sidebar
3. Switch to Retenção tab — layout changes to sidebar
4. Change chart type in filter bar — chart updates
5. Change date range — data refetches
6. "Atualizar" link refreshes data
7. Detailed results table shows below Trends chart
8. Save button saves correctly
9. "..." menu works (duplicate, delete)
10. Edit existing insight — title/description inline editable
11. Back arrow navigates to insights list

**Step 3: Run biome check**
```bash
bun run check
```

**Step 4: Final commit**
```bash
git add -A
git commit -m "feat(analytics): complete PostHog-style insight builder redesign"
```

---

## File Summary

| Action | File | Lines (est) |
|--------|------|-------------|
| Create | `features/analytics/ui/insight-header.tsx` | ~100 |
| Create | `features/analytics/ui/insight-filter-bar.tsx` | ~140 |
| Create | `features/analytics/ui/insight-status-line.tsx` | ~30 |
| Create | `features/analytics/ui/trends-results-table.tsx` | ~80 |
| Rewrite | `features/analytics/ui/insight-builder.tsx` | ~200 |
| Modify | `features/analytics/ui/trends-query-builder.tsx` | remove ~80 lines |
| Modify | `features/analytics/ui/funnels-query-builder.tsx` | remove ~30 lines |
| Modify | `features/analytics/ui/retention-query-builder.tsx` | remove ~30 lines |
| Modify | `routes/.../insights/$insightId.tsx` | ~150 |
| Modify | `routes/.../insights/new.tsx` | ~90 |
| **Unchanged** | `insight-preview.tsx`, `use-insight-config.ts`, all chart components | — |
