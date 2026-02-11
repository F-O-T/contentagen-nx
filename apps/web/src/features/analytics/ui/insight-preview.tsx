import type {
   FunnelsConfig,
   FunnelsResult,
   InsightConfig,
   RetentionConfig,
   RetentionResult,
   TrendsConfig,
   TrendsResult,
} from "@packages/analytics/types";
import {
   Card,
   CardContent,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { Skeleton } from "@packages/ui/components/skeleton";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, BarChart3 } from "lucide-react";
import { orpc } from "@/integrations/orpc/client";
import { FunnelChart } from "../charts/funnel-chart";
import { RetentionGrid } from "../charts/retention-grid";
import { TrendsBarChart } from "../charts/trends-bar-chart";
import { TrendsLineChart } from "../charts/trends-line-chart";
import { TrendsNumberCard } from "../charts/trends-number-card";

interface InsightPreviewProps {
   config: InsightConfig;
}

function LoadingState() {
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

function ErrorState({ error }: { error: Error }) {
   return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
         <AlertCircle className="size-8 text-destructive/60" />
         <p className="text-sm text-center max-w-xs">
            Erro ao carregar prévia: {error.message}
         </p>
      </div>
   );
}

function EmptyState() {
   return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
         <BarChart3 className="size-8" />
         <p className="text-sm">
            Nenhum dado disponível para esta configuração
         </p>
      </div>
   );
}

function TrendsPreview({
   config,
   data,
}: {
   config: TrendsConfig;
   data: TrendsResult;
}) {
   const seriesGroups = new Map<
      number,
      { key: string; label: string; color: string }
   >();
   for (const s of config.series) {
      const idx = config.series.indexOf(s);
      seriesGroups.set(idx, {
         key: s.event || `series_${idx}`,
         label: s.label || s.event || `Series ${String.fromCharCode(65 + idx)}`,
         color: `hsl(var(--chart-${idx + 1}))`,
      });
   }

   const series = Array.from(seriesGroups.values());
   if (series.length === 0) {
      return (
         <div className="flex items-center justify-center h-64 text-muted-foreground">
            Adicione um evento para ver a prévia
         </div>
      );
   }

   // Transform TrendsDataPoint[] into chart-friendly format grouped by intervalStart
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

   const chartData = Array.from(chartDataMap.values()).sort((a, b) =>
      String(a.date).localeCompare(String(b.date)),
   );

   // Build comparison data if available
   let comparisonData: Array<Record<string, unknown>> | undefined;
   if (data.comparison) {
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
      comparisonData = Array.from(compMap.values()).sort((a, b) =>
         String(a.date).localeCompare(String(b.date)),
      );
   }

   // Build formula series entry if formula data exists
   const allSeries = data.formulaData
      ? [
           ...series,
           {
              key: "__formula",
              label: "Formula",
              color: "hsl(var(--chart-6))",
           },
        ]
      : series;

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
   if (config.steps.length < 2) {
      return (
         <div className="flex items-center justify-center h-64 text-muted-foreground">
            Adicione pelo menos 2 etapas para ver a prévia
         </div>
      );
   }

   const steps = data.steps.map((step) => ({
      name: step.label || step.event,
      count: step.count,
   }));

   const comparisonSteps = data.comparison
      ? data.comparison.steps.map((step) => ({
           name: step.label || step.event,
           count: step.count,
        }))
      : undefined;

   return <FunnelChart comparisonSteps={comparisonSteps} steps={steps} />;
}

function RetentionPreview({
   config,
   data,
}: {
   config: RetentionConfig;
   data: RetentionResult;
}) {
   const gridData = data.cohorts.map((cohort) => ({
      cohort: cohort.cohortLabel,
      size: cohort.cohortSize,
      values: cohort.retentionByPeriod.map((p) => p.retained),
   }));

   const periodLabels = Array.from({ length: config.totalPeriods }, (_, i) => {
      const label =
         config.period === "day"
            ? "Day"
            : config.period === "week"
              ? "Week"
              : "Month";
      return `${label} ${i + 1}`;
   });

   const comparisonCohorts = data.comparison
      ? data.comparison.cohorts.map((cohort) => ({
           cohort: cohort.cohortLabel,
           size: cohort.cohortSize,
           values: cohort.retentionByPeriod.map((p) => p.retained),
        }))
      : undefined;

   return (
      <RetentionGrid
         comparisonCohorts={comparisonCohorts}
         data={gridData}
         periods={periodLabels}
      />
   );
}

export function InsightPreview({ config }: InsightPreviewProps) {
   const { data, isLoading, error } = useQuery(
      orpc.analytics.query.queryOptions({
         input: { config },
      }),
   );

   return (
      <Card className="h-full">
         <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
               Prévia
            </CardTitle>
         </CardHeader>
         <CardContent>
            {isLoading && <LoadingState />}
            {error && <ErrorState error={error} />}
            {!isLoading && !error && !data && <EmptyState />}
            {!isLoading && !error && data && (
               <>
                  {config.type === "trends" && (
                     <TrendsPreview
                        config={config}
                        data={data as TrendsResult}
                     />
                  )}
                  {config.type === "funnels" && (
                     <FunnelsPreview
                        config={config}
                        data={data as FunnelsResult}
                     />
                  )}
                  {config.type === "retention" && (
                     <RetentionPreview
                        config={config}
                        data={data as RetentionResult}
                     />
                  )}
               </>
            )}
         </CardContent>
      </Card>
   );
}
