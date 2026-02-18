# Dashboard Date Filter Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix two related dashboard date-filter bugs: (1) absolute date ranges from the global selector are never applied to chart queries, and (2) the date picker only shows presets with no calendar-based custom range selector.

**Architecture:** Bug 1 fix is a pure logic change — extend `toAnalyticsDateRange()` to parse `{ type: "absolute", value: "YYYY-MM-DD,YYYY-MM-DD" }` into the analytics `absoluteDateRangeSchema` format, and update the tile header label to reflect global overrides. Bug 2 fix creates a new `DateRangePicker` UI component and wires it into the dashboard filter bar.

**Tech Stack:** React, TypeScript, react-day-picker (already installed), date-fns (already installed), TanStack Query, oRPC, Tailwind / shadcn-style components.

---

## Current State Analysis

Looking at the actual code (not just the issue description):

### What's already correct
- `editable-dashboard-grid.tsx:390-391` already passes `globalDateRange` and `globalFilters` to `DashboardTile` ✅
- `dashboard-tile.tsx:234-264` `DashboardInsightContent` already calls `mergeGlobalFilters()` ✅
- `mergeGlobalFilters()` already overrides `config.dateRange` when analytics date range is available ✅

### What's broken
1. `toAnalyticsDateRange()` in `dashboard-tile.tsx:154-171` only handles `type === "relative"` — returns `undefined` for `type === "absolute"`, so absolute ranges are silently ignored
2. `DashboardDateRangeSchema` stores absolute as `{ type: "absolute", value: "YYYY-MM-DD,YYYY-MM-DD" }` but analytics `absoluteDateRangeSchema` expects `{ type: "absolute", start: ISO datetime, end: ISO datetime }` — need to parse the value string
3. Tile header `dateRangeLabel` (`useInsightMetadata`) ignores any global override — shows insight's own dateRange even when a global override is active
4. `DashboardFilterBar` only renders 5 hardcoded preset buttons — no calendar UI, no way to produce `type: "absolute"` values

---

## Task 1: Fix `toAnalyticsDateRange` to handle absolute date ranges

**Files:**
- Modify: `apps/web/src/features/analytics/ui/dashboard-tile.tsx:154-171`

**Step 1: Read the current function**

Read lines 154–171 of `dashboard-tile.tsx`. Current code:
```typescript
function toAnalyticsDateRange(dr: DashboardDateRange): DateRange | undefined {
   if (dr.type !== "relative") return undefined;
   // ... only handles relative
}
```

**Step 2: Extend the function to parse absolute ranges**

The `DashboardDateRange.value` for absolute is `"YYYY-MM-DD,YYYY-MM-DD"` (e.g. `"2026-01-05,2026-02-18"`).
The analytics `absoluteDateRangeSchema` expects `{ type: "absolute", start: string (ISO datetime), end: string (ISO datetime) }`.

Replace the function body:

```typescript
function toAnalyticsDateRange(dr: DashboardDateRange): DateRange | undefined {
   if (dr.type === "relative") {
      const validValues = [
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
      ] as const;
      type ValidValue = (typeof validValues)[number];
      if (!validValues.includes(dr.value as ValidValue)) return undefined;
      return { type: "relative", value: dr.value as ValidValue };
   }

   if (dr.type === "absolute") {
      const parts = dr.value.split(",");
      if (parts.length !== 2) return undefined;
      const [startStr, endStr] = parts;
      // Parse as start-of-day and end-of-day in UTC
      const start = new Date(`${startStr}T00:00:00.000Z`);
      const end = new Date(`${endStr}T23:59:59.999Z`);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return undefined;
      return {
         type: "absolute",
         start: start.toISOString(),
         end: end.toISOString(),
      };
   }

   return undefined;
}
```

**Step 3: Verify TypeScript compiles**

Run: `cd /home/yorizel/Documents/contentta-nx && bun run typecheck 2>&1 | grep -E "dashboard-tile|error TS" | head -20`

Expected: no errors in dashboard-tile.tsx

**Step 4: Commit**

```bash
git add apps/web/src/features/analytics/ui/dashboard-tile.tsx
git commit -m "fix(analytics): parse absolute date ranges in toAnalyticsDateRange"
```

---

## Task 2: Update tile header label to reflect global date range override

**Files:**
- Modify: `apps/web/src/features/analytics/ui/dashboard-tile.tsx:269-302` (`useInsightMetadata`) and `dashboard-tile.tsx:340-371` (`DashboardTile` props)

**Background:** The tile header shows `typeLabel • dateRangeLabel`. Currently `dateRangeLabel` is derived from the insight's own `config.dateRange` and ignores any `globalDateRange` prop. After fix, if `globalDateRange` is active, the header should show the global range label instead.

**Step 1: Add `globalDateRange` parameter to `useInsightMetadata`**

Change the hook signature from:
```typescript
function useInsightMetadata(insightName?: string, insightId?: string) {
```
To:
```typescript
function useInsightMetadata(
   insightName?: string,
   insightId?: string,
   globalDateRange?: DashboardDateRange,
) {
```

**Step 2: Update `dateRangeLabel` derivation inside `useInsightMetadata`**

Replace the existing `dateRangeLabel` block (lines ~293-299) with:

```typescript
// Global override takes precedence over insight-level date range
const effectiveDateRange = globalDateRange ?? dateRange;
const dateRangeLabel = effectiveDateRange?.value
   ? formatDateRange(effectiveDateRange.value)
   : "ÚLTIMOS 30 DIAS";
```

**Step 3: Extend `formatDateRange` to handle absolute date strings**

After the existing `switch` statement in `formatDateRange` (line ~304-322), the `default` case already returns `value.toUpperCase()`. But for `"2026-01-05,2026-02-18"` that's ugly. Instead, detect the comma-separated date pattern and format it nicely:

Replace the `default` case:
```typescript
default: {
   // Try to parse as absolute "YYYY-MM-DD,YYYY-MM-DD"
   const parts = value.split(",");
   if (parts.length === 2) {
      const fmt = (s: string) =>
         new Date(`${s}T00:00:00Z`).toLocaleDateString("pt-BR", {
            day: "numeric",
            month: "short",
            year: "numeric",
         });
      return `${fmt(parts[0])} – ${fmt(parts[1])}`;
   }
   return value.toUpperCase();
}
```

**Step 4: Pass `globalDateRange` to `useInsightMetadata` in `DashboardTile`**

Change line ~370-371:
```typescript
const { name, description, typeLabel, dateRangeLabel, lastComputedAt } =
   useInsightMetadata(insightName, insightId);
```
To:
```typescript
const { name, description, typeLabel, dateRangeLabel, lastComputedAt } =
   useInsightMetadata(insightName, insightId, globalDateRange);
```

**Step 5: Verify TypeScript compiles**

Run: `bun run typecheck 2>&1 | grep -E "dashboard-tile|error TS" | head -20`

Expected: no errors

**Step 6: Commit**

```bash
git add apps/web/src/features/analytics/ui/dashboard-tile.tsx
git commit -m "fix(analytics): show active global date range in tile header label"
```

---

## Task 3: Create `DateRangePicker` UI component

**Files:**
- Create: `packages/ui/src/components/date-range-picker.tsx`

The component is a split-panel picker:
- **Left panel**: vertical list of preset buttons. Selected preset gets `variant="default"`. Clicking a preset clears any in-progress calendar selection.
- **Right panel**: dual-month `DayPicker` with `mode="range"` and `captionLayout="dropdown"`. When user starts selecting on calendar, preset deselects.

**Props interface:**
```typescript
export interface DateRangePreset {
   label: string;
   value: string; // e.g. "7d", "30d", "this_month"
}

export interface DateRangePickerProps {
   presets: DateRangePreset[];
   selectedPreset?: string | null;         // currently active preset value
   selectedRange?: { from: Date; to?: Date } | null; // calendar range
   onPresetSelect: (value: string) => void;
   onRangeSelect: (range: { from: Date; to: Date }) => void;
   heading?: string;
}
```

**Step 1: Write the component**

Create `packages/ui/src/components/date-range-picker.tsx`:

```typescript
"use client";

import { Button } from "@packages/ui/components/button";
import { Calendar } from "@packages/ui/components/calendar";
import { cn } from "@packages/ui/lib/utils";
import { useState } from "react";
import type { DateRange } from "react-day-picker";

export interface DateRangePreset {
   label: string;
   value: string;
}

export interface DateRangePickerProps {
   presets: DateRangePreset[];
   selectedPreset?: string | null;
   selectedRange?: { from: Date; to?: Date } | null;
   onPresetSelect: (value: string) => void;
   onRangeSelect: (range: { from: Date; to: Date }) => void;
   heading?: string;
}

export function DateRangePicker({
   presets,
   selectedPreset,
   selectedRange,
   onPresetSelect,
   onRangeSelect,
   heading = "Período",
}: DateRangePickerProps) {
   const [pendingRange, setPendingRange] = useState<DateRange | undefined>(
      selectedRange
         ? { from: selectedRange.from, to: selectedRange.to }
         : undefined,
   );

   const handlePresetClick = (value: string) => {
      setPendingRange(undefined);
      onPresetSelect(value);
   };

   const handleCalendarSelect = (range: DateRange | undefined) => {
      setPendingRange(range);
      // Only emit when both start and end are selected
      if (range?.from && range?.to) {
         onRangeSelect({ from: range.from, to: range.to });
      }
   };

   // Show calendar selection if user is picking or has picked a range
   const calendarSelected: DateRange | undefined =
      pendingRange ?? (selectedRange ? { from: selectedRange.from, to: selectedRange.to } : undefined);

   return (
      <div className="flex">
         {/* Left: preset list */}
         <div className="flex flex-col gap-1 p-2 min-w-[160px] border-r">
            {heading && (
               <p className="text-xs font-medium text-muted-foreground px-2 pb-1 pt-0.5 uppercase tracking-wide">
                  {heading}
               </p>
            )}
            {presets.map((preset) => {
               const isActive = selectedPreset === preset.value && !pendingRange?.from;
               return (
                  <Button
                     className="justify-start text-sm font-normal"
                     key={preset.value}
                     onClick={() => handlePresetClick(preset.value)}
                     size="sm"
                     variant={isActive ? "default" : "ghost"}
                  >
                     {preset.label}
                  </Button>
               );
            })}
         </div>

         {/* Right: dual-month calendar */}
         <div className="p-2">
            <Calendar
               captionLayout="dropdown"
               endMonth={new Date(new Date().getFullYear(), new Date().getMonth())}
               fromYear={2020}
               mode="range"
               numberOfMonths={2}
               onSelect={handleCalendarSelect}
               selected={calendarSelected}
               toYear={new Date().getFullYear()}
            />
         </div>
      </div>
   );
}
```

**Step 2: Verify TypeScript compiles**

Run: `bun run typecheck 2>&1 | grep -E "date-range-picker|error TS" | head -20`

Expected: no errors

**Step 3: Commit**

```bash
git add packages/ui/src/components/date-range-picker.tsx
git commit -m "feat(ui): add DateRangePicker component with preset list and dual-month calendar"
```

---

## Task 4: Wire `DateRangePicker` into `DashboardFilterBar`

**Files:**
- Modify: `apps/web/src/features/analytics/ui/dashboard-view.tsx`

**Step 1: Add import for `DateRangePicker`**

At the top of `dashboard-view.tsx`, add:
```typescript
import { DateRangePicker } from "@packages/ui/components/date-range-picker";
```

**Step 2: Expand the presets list**

Replace the existing `DATE_RANGE_PRESETS` constant (lines 141-147):
```typescript
const DATE_RANGE_PRESETS = [
   { label: "Últimos 7 dias", value: "7d" },
   { label: "Últimos 30 dias", value: "30d" },
   { label: "Últimos 90 dias", value: "90d" },
   { label: "Este mês", value: "this_month" },
   { label: "Mês passado", value: "last_month" },
   { label: "Este ano", value: "this_year" },
] as const;
```

**Step 3: Add `handleAbsoluteRangeChange` handler**

After `handleRemoveDateRange` in `DashboardFilterBar`, add:

```typescript
const handleAbsoluteRangeChange = (range: { from: Date; to: Date }) => {
   const fmt = (d: Date) => d.toISOString().split("T")[0];
   const dateRange: DashboardDateRange = {
      type: "absolute",
      value: `${fmt(range.from)},${fmt(range.to)}`,
   };
   updateFiltersMutation.mutate({
      dashboardId: dashboard.id,
      globalDateRange: dateRange,
   });
   setIsDateRangeOpen(false);
};
```

**Step 4: Update `dateRangeLabel` to handle absolute type**

Replace the `dateRangeLabel` memo (lines 238-244):

```typescript
const dateRangeLabel = useMemo(() => {
   if (!dashboard.globalDateRange) return "Sem período global";
   if (dashboard.globalDateRange.type === "absolute") {
      const parts = dashboard.globalDateRange.value.split(",");
      if (parts.length === 2) {
         const fmt = (s: string) =>
            new Date(`${s}T00:00:00Z`).toLocaleDateString("pt-BR", {
               day: "numeric",
               month: "short",
            });
         return `${fmt(parts[0])} – ${fmt(parts[1])}`;
      }
   }
   const preset = DATE_RANGE_PRESETS.find(
      (p) => p.value === dashboard.globalDateRange?.value,
   );
   return preset?.label ?? dashboard.globalDateRange.value;
}, [dashboard.globalDateRange]);
```

**Step 5: Replace the preset-only `PopoverContent` with `DateRangePicker`**

Replace the `<PopoverContent>` block (lines 265-298) with:

```typescript
<PopoverContent align="start" className="w-auto p-0">
   <DateRangePicker
      heading="Período"
      onPresetSelect={handleDateRangeChange}
      onRangeSelect={handleAbsoluteRangeChange}
      presets={DATE_RANGE_PRESETS as unknown as { label: string; value: string }[]}
      selectedPreset={
         dashboard.globalDateRange?.type === "relative"
            ? dashboard.globalDateRange.value
            : null
      }
      selectedRange={
         dashboard.globalDateRange?.type === "absolute"
            ? (() => {
                 const parts = dashboard.globalDateRange.value.split(",");
                 if (parts.length !== 2) return null;
                 return {
                    from: new Date(`${parts[0]}T00:00:00Z`),
                    to: new Date(`${parts[1]}T23:59:59Z`),
                 };
              })()
            : null
      }
   />
   {dashboard.globalDateRange && (
      <div className="border-t p-2">
         <Button
            className="w-full justify-start text-destructive hover:text-destructive"
            onClick={handleRemoveDateRange}
            size="sm"
            variant="ghost"
         >
            <X className="size-3.5" />
            Remover período global
         </Button>
      </div>
   )}
</PopoverContent>
```

**Step 6: Verify TypeScript compiles**

Run: `bun run typecheck 2>&1 | grep -E "dashboard-view|error TS" | head -20`

Expected: no errors

**Step 7: Commit**

```bash
git add apps/web/src/features/analytics/ui/dashboard-view.tsx
git commit -m "feat(analytics): replace preset-only date picker with split-panel DateRangePicker"
```

---

## Task 5: Final verification

**Step 1: Full typecheck**

Run: `bun run typecheck 2>&1 | tail -20`

Expected: `Found 0 errors.` (or zero new errors introduced by these changes)

**Step 2: Lint/format check**

Run: `bun run check 2>&1 | grep -E "(dashboard-tile|dashboard-view|date-range-picker)" | head -20`

Expected: no lint errors in touched files

**Step 3: Manual smoke test checklist**
- [ ] Navigate to a dashboard
- [ ] Click the date range button → should see split-panel with preset list on left + dual-month calendar on right
- [ ] Select "Últimos 7 dias" → button label updates → charts refetch with 7d data
- [ ] Click custom calendar range (pick start + end date) → button label shows "5 jan – 18 fev 2026" style → charts refetch with absolute date range
- [ ] Tile header shows the active global date range label (not insight's own label)
- [ ] Click "Remover período global" → tiles revert to their own configs

---

## Summary of changes

| File | Change |
|------|--------|
| `apps/web/src/features/analytics/ui/dashboard-tile.tsx` | Extend `toAnalyticsDateRange` for absolute dates; update `useInsightMetadata` to accept + apply `globalDateRange`; extend `formatDateRange` for comma-separated date strings |
| `packages/ui/src/components/date-range-picker.tsx` | **New** split-panel date range picker component |
| `apps/web/src/features/analytics/ui/dashboard-view.tsx` | Extend presets list; add `handleAbsoluteRangeChange`; update `dateRangeLabel` for absolute type; replace preset-only popover with `DateRangePicker` |
