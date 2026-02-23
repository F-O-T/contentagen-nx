import type {
   FunnelsConfig,
   InsightConfig,
   RetentionConfig,
   TrendsConfig,
   TrendsResult,
} from "@packages/analytics/types";
import { Button } from "@packages/ui/components/button";
import { Card, CardContent } from "@packages/ui/components/card";
import { cn } from "@packages/ui/lib/utils";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import type { InsightType } from "@/features/analytics/hooks/use-insight-config";
import { FunnelsQueryBuilder } from "./funnels-query-builder";
import { InsightFilterBar } from "./insight-filter-bar";
import { InsightHeader } from "./insight-header";
import {
   InsightErrorState,
   InsightLoadingState,
   InsightPreview,
} from "./insight-preview";
import { InsightStatusLine } from "./insight-status-line";
import { RetentionQueryBuilder } from "./retention-query-builder";
import { TrendsQueryBuilder } from "./trends-query-builder";
import { TrendsResultsTable } from "./trends-results-table";

const INSIGHT_TABS: { value: InsightType; label: string }[] = [
   { value: "trends", label: "Tendências" },
   { value: "funnels", label: "Funis" },
   { value: "retention", label: "Retenção" },
];

interface InsightBuilderProps {
   name: string;
   onNameChange: (name: string) => void;
   description: string;
   onDescriptionChange: (description: string) => void;
   type: InsightType;
   config: InsightConfig;
   onTypeChange: (type: InsightType) => void;
   onConfigUpdate: (updates: Partial<InsightConfig>) => void;
   onSave: () => void;
   isSaving: boolean;
   onDuplicate?: () => void;
   onDelete?: () => void;
   lastComputedAt?: Date | null;
   onRefresh: () => void;
   isRefreshing?: boolean;
   queryResult?: unknown;
}

export function InsightBuilder({
   name,
   onNameChange,
   description,
   onDescriptionChange,
   type,
   config,
   onTypeChange,
   onConfigUpdate,
   onSave,
   isSaving,
   onDuplicate,
   onDelete,
   lastComputedAt,
   onRefresh,
   isRefreshing = false,
   queryResult,
}: InsightBuilderProps) {
   const isTrends = type === "trends";
   const isFunnels = type === "funnels";
   const isRetention = type === "retention";

   return (
      <main className="flex flex-col gap-0">
         {/* Header */}
         <InsightHeader
            description={description}
            isSaving={isSaving}
            name={name}
            onDelete={onDelete}
            onDescriptionChange={onDescriptionChange}
            onDuplicate={onDuplicate}
            onNameChange={onNameChange}
            onSave={onSave}
         />

         {/* Tab bar */}
         <div className="flex items-center border-t border-b py-1">
            {INSIGHT_TABS.map((tab) => (
               <Button
                  className={cn(
                     "px-4 py-2 h-auto rounded-none border-b-2 text-sm font-medium",
                     type === tab.value
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/50",
                  )}
                  key={tab.value}
                  onClick={() => onTypeChange(tab.value)}
                  variant="ghost"
               >
                  {tab.label}
               </Button>
            ))}
         </div>

         {/* Content */}
         <div className="flex flex-col gap-4 pt-4">
            {/* TRENDS — full-width vertical flow */}
            {isTrends && (
               <>
                  <TrendsQueryBuilder
                     config={config as TrendsConfig}
                     onUpdate={onConfigUpdate}
                  />

                  <Card>
                     <CardContent className="p-0">
                        <div className="px-4">
                           <InsightFilterBar
                              chartType={(config as TrendsConfig).chartType}
                              compare={config.compare}
                              dateRange={
                                 (config as { dateRange: { value: string } })
                                    .dateRange.value
                              }
                              interval={(config as TrendsConfig).interval}
                              onChartTypeChange={(v) =>
                                 onConfigUpdate({
                                    chartType: v as
                                       | "number"
                                       | "area"
                                       | "line"
                                       | "bar",
                                 })
                              }
                              onCompareChange={(v) =>
                                 onConfigUpdate({ compare: v })
                              }
                              onDateRangeChange={(v) =>
                                 onConfigUpdate({
                                    dateRange: {
                                       type: "relative",
                                       value: v as
                                          | "7d"
                                          | "14d"
                                          | "30d"
                                          | "90d"
                                          | "180d"
                                          | "12m"
                                          | "this_month"
                                          | "last_month"
                                          | "this_quarter"
                                          | "this_year",
                                    },
                                 })
                              }
                              onIntervalChange={(v) =>
                                 onConfigUpdate({
                                    interval: v as
                                       | "month"
                                       | "day"
                                       | "week"
                                       | "hour",
                                 })
                              }
                              type="trends"
                           />
                        </div>
                        <div className="px-4">
                           <InsightStatusLine
                              isRefreshing={isRefreshing}
                              lastComputedAt={lastComputedAt}
                              onRefresh={onRefresh}
                           />
                        </div>
                        <div className="min-h-[400px] p-4">
                           <ErrorBoundary
                              fallbackRender={({ error }) => (
                                 <InsightErrorState error={error as Error} />
                              )}
                           >
                              <Suspense fallback={<InsightLoadingState />}>
                                 <InsightPreview config={config} />
                              </Suspense>
                           </ErrorBoundary>
                        </div>
                     </CardContent>
                  </Card>

                  {queryResult && (
                     <TrendsResultsTable
                        config={config as TrendsConfig}
                        result={queryResult as TrendsResult}
                     />
                  )}
               </>
            )}

            {/* FUNNELS — sidebar layout */}
            {isFunnels && (
               <div className="flex gap-4">
                  <div className="w-[400px] shrink-0">
                     <Card className="sticky top-4">
                        <CardContent className="p-6">
                           <FunnelsQueryBuilder
                              config={config as FunnelsConfig}
                              onUpdate={onConfigUpdate}
                           />
                        </CardContent>
                     </Card>
                  </div>

                  <Card className="flex-1 min-w-0">
                     <CardContent className="p-0">
                        <div className="px-4">
                           <InsightFilterBar
                              dateRange={
                                 (config as { dateRange: { value: string } })
                                    .dateRange.value
                              }
                              onDateRangeChange={(v) =>
                                 onConfigUpdate({
                                    dateRange: {
                                       type: "relative",
                                       value: v as
                                          | "7d"
                                          | "14d"
                                          | "30d"
                                          | "90d"
                                          | "180d"
                                          | "12m"
                                          | "this_month"
                                          | "last_month"
                                          | "this_quarter"
                                          | "this_year",
                                    },
                                 })
                              }
                              type={type}
                           />
                        </div>
                        <div className="px-4">
                           <InsightStatusLine
                              isRefreshing={isRefreshing}
                              lastComputedAt={lastComputedAt}
                              onRefresh={onRefresh}
                           />
                        </div>
                        <div className="min-h-[400px] p-4">
                           <ErrorBoundary
                              fallbackRender={({ error }) => (
                                 <InsightErrorState error={error as Error} />
                              )}
                           >
                              <Suspense fallback={<InsightLoadingState />}>
                                 <InsightPreview config={config} />
                              </Suspense>
                           </ErrorBoundary>
                        </div>
                     </CardContent>
                  </Card>
               </div>
            )}

            {/* RETENTION — sidebar layout */}
            {isRetention && (
               <div className="flex gap-4">
                  <div className="w-[400px] shrink-0">
                     <Card className="sticky top-4">
                        <CardContent className="p-6">
                           <RetentionQueryBuilder
                              config={config as RetentionConfig}
                              onUpdate={onConfigUpdate}
                           />
                        </CardContent>
                     </Card>
                  </div>

                  <Card className="flex-1 min-w-0">
                     <CardContent className="p-0">
                        <div className="px-4">
                           <InsightFilterBar
                              dateRange={
                                 (config as { dateRange: { value: string } })
                                    .dateRange.value
                              }
                              onDateRangeChange={(v) =>
                                 onConfigUpdate({
                                    dateRange: {
                                       type: "relative",
                                       value: v as
                                          | "7d"
                                          | "14d"
                                          | "30d"
                                          | "90d"
                                          | "180d"
                                          | "12m"
                                          | "this_month"
                                          | "last_month"
                                          | "this_quarter"
                                          | "this_year",
                                    },
                                 })
                              }
                              type={type}
                           />
                        </div>
                        <div className="px-4">
                           <InsightStatusLine
                              isRefreshing={isRefreshing}
                              lastComputedAt={lastComputedAt}
                              onRefresh={onRefresh}
                           />
                        </div>
                        <div className="min-h-[400px] p-4">
                           <ErrorBoundary
                              fallbackRender={({ error }) => (
                                 <InsightErrorState error={error as Error} />
                              )}
                           >
                              <Suspense fallback={<InsightLoadingState />}>
                                 <InsightPreview config={config} />
                              </Suspense>
                           </ErrorBoundary>
                        </div>
                     </CardContent>
                  </Card>
               </div>
            )}
         </div>
      </main>
   );
}
