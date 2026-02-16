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
import type { InsightType } from "@/features/analytics/hooks/use-insight-config";
import { FunnelsQueryBuilder } from "./funnels-query-builder";
import { InsightFilterBar } from "./insight-filter-bar";
import { InsightHeader } from "./insight-header";
import { InsightPreview } from "./insight-preview";
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
   backTo: { slug: string; teamSlug: string };
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
   backTo,
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
      <div className="flex flex-col gap-0 h-full">
         {/* Header */}
         <InsightHeader
            backTo={backTo}
            description={description}
            isSaving={isSaving}
            name={name}
            onDelete={onDelete}
            onDescriptionChange={onDescriptionChange}
            onDuplicate={onDuplicate}
            onNameChange={onNameChange}
            onSave={onSave}
            type={type}
         />

         {/* Tab bar */}
         <div className="border-b bg-background">
            <div className="container mx-auto px-4">
               <div className="flex items-center gap-0">
                  {INSIGHT_TABS.map((tab) => (
                     <Button
                        className={cn(
                           "px-4 py-2.5 h-auto rounded-none border-b-2 text-sm font-medium",
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
            </div>
         </div>

         {/* Content */}
         <div className="flex-1 overflow-auto">
            <div className="container mx-auto px-4 py-6 flex flex-col gap-4">
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
                                    (config as TrendsConfig).dateRange.value
                                 }
                                 interval={(config as TrendsConfig).interval}
                                 onChartTypeChange={(v) =>
                                    onConfigUpdate({ chartType: v })
                                 }
                                 onCompareChange={(v) =>
                                    onConfigUpdate({ compare: v })
                                 }
                                 onDateRangeChange={(v) =>
                                    onConfigUpdate({
                                       dateRange: {
                                          type: "relative",
                                          value: v,
                                       },
                                    })
                                 }
                                 onIntervalChange={(v) =>
                                    onConfigUpdate({ interval: v })
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
                              <InsightPreview config={config} />
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
                                 dateRange={config.dateRange.value}
                                 onDateRangeChange={(v) =>
                                    onConfigUpdate({
                                       dateRange: {
                                          type: "relative",
                                          value: v,
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
                              <InsightPreview config={config} />
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
                                 dateRange={config.dateRange.value}
                                 onDateRangeChange={(v) =>
                                    onConfigUpdate({
                                       dateRange: {
                                          type: "relative",
                                          value: v,
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
                              <InsightPreview config={config} />
                           </div>
                        </CardContent>
                     </Card>
                  </div>
               )}
            </div>
         </div>
      </div>
   );
}
