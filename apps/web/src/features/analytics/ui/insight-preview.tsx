import type {
   FunnelsConfig,
   FunnelsResult,
   InsightConfig,
   RetentionConfig,
   RetentionResult,
   TrendsConfig,
   TrendsResult,
} from "@packages/analytics/types";
import { Skeleton } from "@packages/ui/components/skeleton";
import { useSuspenseQuery } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";
import { useMemo } from "react";
import { orpc } from "@/integrations/orpc/client";
import { FunnelChart } from "../charts/funnel-chart";
import { RetentionGrid } from "../charts/retention-grid";
import { TrendsBarChart } from "../charts/trends-bar-chart";
import { TrendsLineChart } from "../charts/trends-line-chart";
import { TrendsNumberCard } from "../charts/trends-number-card";

interface InsightPreviewProps {
   config: InsightConfig;
}

export function InsightLoadingState() {
   return (
      <div className="space-y-4">
         <Skeleton className="h-4 w-1/3" />
         <Skeleton className="h-[200px] w-full" />
         <div className="flex gap-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-20" />
         </div>
      </div>
   );
}

export function InsightErrorState({ error }: { error: Error }) {
   return (
      <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground">
         <AlertCircle className="size-5 text-destructive/60" />
         <p className="text-xs text-center">{error.message}</p>
      </div>
   );
}

/**
 * Generate placeholder date labels for the last N days.
 * Used to render an empty chart shell with proper x-axis labels.
 */
function generatePlaceholderDates(
   days: number,
): Array<Record<string, unknown>> {
   const now = new Date();
   return Array.from({ length: days }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (days - 1 - i));
      return { date: d.toISOString().split("T")[0] };
   });
}

/**
 * Returns the number of days to show on the empty chart placeholder
 * based on the config's date range selection.
 */
function getPlaceholderDays(dateRange: TrendsConfig["dateRange"]): number {
   if (!dateRange) return 30;
   if (dateRange.type === "absolute") {
      const start = new Date(dateRange.start);
      const end = new Date(dateRange.end);
      return Math.max(
         1,
         Math.ceil((end.getTime() - start.getTime()) / 86_400_000),
      );
   }
   switch (dateRange.value) {
      case "7d":
         return 7;
      case "14d":
         return 14;
      case "30d":
         return 30;
      case "90d":
         return 90;
      case "180d":
         return 180;
      case "12m":
         return 365;
      case "this_month":
         return new Date().getDate();
      case "this_quarter":
         return 90;
      case "this_year":
         return Math.ceil(
            (Date.now() - new Date(new Date().getFullYear(), 0, 1).getTime()) /
               86_400_000,
         );
      case "last_month": {
         const d = new Date();
         d.setDate(0); // last day of prev month
         return d.getDate();
      }
      default:
         return 30;
   }
}

/**
 * Renders an empty chart with grid lines and date axis labels.
 * Matches PostHog behavior where charts show their skeleton even without data.
 */
function EmptyTrendsChart({ config }: { config: TrendsConfig }) {
   const series = useMemo(() => {
      const groups = new Map<
         number,
         { key: string; label: string; color: string }
      >();
      for (const s of config.series) {
         const idx = config.series.indexOf(s);
         groups.set(idx, {
            key: s.event || `series_${idx}`,
            label:
               s.label || s.event || `Series ${String.fromCharCode(65 + idx)}`,
            color: `var(--chart-${idx + 1})`,
         });
      }
      return Array.from(groups.values());
   }, [config.series]);

   const placeholderData = useMemo(
      () =>
         generatePlaceholderDates(getPlaceholderDays(config.dateRange)).map(
            (point) => {
               const row: Record<string, unknown> = { ...point };
               for (const s of series) {
                  row[s.key] = 0;
               }
               return row;
            },
         ),
      [config.dateRange, series],
   );

   if (series.length === 0) {
      return (
         <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
            Adicione um evento para ver a prévia
         </div>
      );
   }

   const xAxisFormatter = (value: string) =>
      new Date(value).toLocaleDateString("pt-BR", {
         day: "numeric",
         month: "short",
      });

   if (config.chartType === "number") {
      return <TrendsNumberCard label={series[0].label} value={0} />;
   }

   if (config.chartType === "bar") {
      return (
         <TrendsBarChart
            data={placeholderData}
            series={series}
            xAxisFormatter={xAxisFormatter}
            xAxisKey="date"
         />
      );
   }

   return (
      <TrendsLineChart
         data={placeholderData}
         series={series}
         xAxisFormatter={xAxisFormatter}
         xAxisKey="date"
      />
   );
}

function TrendsPreview({
   config,
   data,
}: {
   config: TrendsConfig;
   data: TrendsResult;
}) {
   const seriesGroups = useMemo(() => {
      const groups = new Map<
         number,
         { key: string; label: string; color: string }
      >();
      for (const s of config.series) {
         const idx = config.series.indexOf(s);
         groups.set(idx, {
            key: s.event || `series_${idx}`,
            label:
               s.label || s.event || `Series ${String.fromCharCode(65 + idx)}`,
            color: `var(--chart-${idx + 1})`,
         });
      }
      return groups;
   }, [config.series]);

   const series = useMemo(
      () => Array.from(seriesGroups.values()),
      [seriesGroups],
   );

   // Transform TrendsDataPoint[] into chart-friendly format grouped by intervalStart
   const chartData = useMemo(() => {
      const chartDataMap = new Map<string, Record<string, unknown>>();
      for (const point of data.data) {
         const existing = chartDataMap.get(point.intervalStart) ?? {
            date: point.intervalStart,
         };
         const seriesInfo = seriesGroups.get(point.seriesIndex);
         if (seriesInfo) {
            existing[seriesInfo.key] = point.value;
         }
         chartDataMap.set(point.intervalStart, existing);
      }

      // Add formula data if present
      if (data.formulaData) {
         for (const point of data.formulaData) {
            const existing = chartDataMap.get(point.intervalStart) ?? {
               date: point.intervalStart,
            };
            existing.__formula = point.value;
            chartDataMap.set(point.intervalStart, existing);
         }
      }

      return Array.from(chartDataMap.values()).sort((a, b) =>
         String(a.date).localeCompare(String(b.date)),
      );
   }, [data.data, data.formulaData, seriesGroups]);

   // Build comparison data if available
   const comparisonData = useMemo(() => {
      if (!data.comparison) return undefined;
      const compMap = new Map<string, Record<string, unknown>>();
      for (const point of data.comparison.data) {
         const existing = compMap.get(point.intervalStart) ?? {
            date: point.intervalStart,
         };
         const seriesInfo = seriesGroups.get(point.seriesIndex);
         if (seriesInfo) {
            existing[seriesInfo.key] = point.value;
         }
         compMap.set(point.intervalStart, existing);
      }
      return Array.from(compMap.values()).sort((a, b) =>
         String(a.date).localeCompare(String(b.date)),
      );
   }, [data.comparison, seriesGroups]);

   // Build formula series entry if formula data exists
   const allSeries = useMemo(
      () =>
         data.formulaData
            ? [
                 ...series,
                 {
                    key: "__formula",
                    label: "Formula",
                    color: "var(--chart-6)",
                 },
              ]
            : series,
      [data.formulaData, series],
   );

   if (series.length === 0) {
      return (
         <div className="flex items-center justify-center h-64 text-muted-foreground">
            Adicione um evento para ver a prévia
         </div>
      );
   }

   // If we have config but no data points, show empty chart with axes
   if (chartData.length === 0) {
      return <EmptyTrendsChart config={config} />;
   }

   const xAxisFormatter = (value: string) =>
      new Date(value).toLocaleDateString("pt-BR", {
         day: "numeric",
         month: "short",
      });

   if (config.chartType === "number") {
      const total = data.totals[0]?.total ?? 0;
      const comparisonChange = data.comparison?.percentageChanges?.[0];
      const trend = comparisonChange
         ? {
              value: Math.abs(comparisonChange.change),
              direction: (comparisonChange.change >= 0 ? "up" : "down") as
                 | "up"
                 | "down",
              comparison: "vs previous period",
           }
         : undefined;
      return (
         <TrendsNumberCard
            label={series[0].label}
            trend={trend}
            value={total}
         />
      );
   }

   if (config.chartType === "bar") {
      return (
         <TrendsBarChart
            comparisonData={comparisonData}
            data={chartData}
            series={allSeries}
            xAxisFormatter={xAxisFormatter}
            xAxisKey="date"
         />
      );
   }

   return (
      <TrendsLineChart
         comparisonData={comparisonData}
         data={chartData}
         formulaData={
            data.formulaData
               ? data.formulaData.map((p) => ({
                    date: p.intervalStart,
                    value: p.value,
                 }))
               : undefined
         }
         series={allSeries}
         xAxisFormatter={xAxisFormatter}
         xAxisKey="date"
      />
   );
}

function FunnelsPreview({
   config,
   data,
}: {
   config: FunnelsConfig;
   data: FunnelsResult;
}) {
   const steps = useMemo(
      () =>
         data.steps.map((step) => ({
            name: step.label || step.event,
            count: step.count,
         })),
      [data.steps],
   );

   const comparisonSteps = useMemo(
      () =>
         data.comparison
            ? data.comparison.steps.map((step) => ({
                 name: step.label || step.event,
                 count: step.count,
              }))
            : undefined,
      [data.comparison],
   );

   if (config.steps.length < 2) {
      return (
         <div className="flex items-center justify-center h-64 text-muted-foreground">
            Adicione pelo menos 2 etapas para ver a prévia
         </div>
      );
   }

   return <FunnelChart comparisonSteps={comparisonSteps} steps={steps} />;
}

function RetentionPreview({
   config,
   data,
}: {
   config: RetentionConfig;
   data: RetentionResult;
}) {
   const gridData = useMemo(
      () =>
         data.cohorts.map((cohort) => ({
            cohort: cohort.cohortLabel,
            size: cohort.cohortSize,
            values: cohort.retentionByPeriod.map((p) => p.retained),
         })),
      [data.cohorts],
   );

   const periodLabels = useMemo(() => {
      const label =
         config.period === "day"
            ? "Day"
            : config.period === "week"
              ? "Week"
              : "Month";
      return Array.from(
         { length: config.totalPeriods },
         (_, i) => `${label} ${i + 1}`,
      );
   }, [config.period, config.totalPeriods]);

   const comparisonCohorts = useMemo(
      () =>
         data.comparison
            ? data.comparison.cohorts.map((cohort) => ({
                 cohort: cohort.cohortLabel,
                 size: cohort.cohortSize,
                 values: cohort.retentionByPeriod.map((p) => p.retained),
              }))
            : undefined,
      [data.comparison],
   );

   return (
      <RetentionGrid
         comparisonCohorts={comparisonCohorts}
         data={gridData}
         periods={periodLabels}
      />
   );
}

export function InsightPreview({ config }: InsightPreviewProps) {
   const { data } = useSuspenseQuery(
      orpc.analytics.query.queryOptions({
         input: { config },
      }),
   );

   return (
      <div className="h-full">
         <div className="space-y-3">
            {config.type === "trends" && (
               <TrendsPreview config={config} data={data as TrendsResult} />
            )}
            {config.type === "funnels" && (
               <FunnelsPreview config={config} data={data as FunnelsResult} />
            )}
            {config.type === "retention" && (
               <RetentionPreview
                  config={config}
                  data={data as RetentionResult}
               />
            )}
         </div>
      </div>
   );
}
