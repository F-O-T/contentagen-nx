import type {
   FunnelsConfig,
   RetentionConfig,
   TrendsConfig,
} from "@packages/analytics/types";
import { Input } from "@packages/ui/components/input";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useInsightConfig } from "@/features/analytics/hooks/use-insight-config";
import { FunnelsQueryBuilder } from "@/features/analytics/ui/funnels-query-builder";
import { InsightPreview } from "@/features/analytics/ui/insight-preview";
import { InsightTabBar } from "@/features/analytics/ui/insight-tab-bar";
import { RetentionQueryBuilder } from "@/features/analytics/ui/retention-query-builder";
import { TrendsQueryBuilder } from "@/features/analytics/ui/trends-query-builder";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamId/_dashboard/analytics/insights/",
)({
   component: InsightsPage,
});

function InsightsPage() {
   const { type, config, setType, updateConfigImmediate } = useInsightConfig();
   const [insightName, setInsightName] = useState("");

   const handleSave = () => {
      // TODO: call orpc.insights.create
      console.log("Save insight:", { name: insightName, type, config });
   };

   return (
      <main className="flex flex-col gap-4 h-full">
         <div className="flex flex-col gap-2">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight font-serif leading-tight">
               Novo Insight
            </h1>
            <Input
               className="max-w-md"
               onChange={(e) => setInsightName(e.target.value)}
               placeholder="Nome do insight (ex: Visualizações por conteúdo)"
               value={insightName}
            />
         </div>
         <InsightTabBar
            activeTab={type}
            onSave={handleSave}
            onTabChange={setType}
         />
         <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 flex-1 min-h-0">
            <div className="overflow-y-auto border rounded-lg p-4 bg-card">
               {type === "trends" && (
                  <TrendsQueryBuilder
                     config={config as TrendsConfig}
                     onUpdate={updateConfigImmediate}
                  />
               )}
               {type === "funnels" && (
                  <FunnelsQueryBuilder
                     config={config as FunnelsConfig}
                     onUpdate={updateConfigImmediate}
                  />
               )}
               {type === "retention" && (
                  <RetentionQueryBuilder
                     config={config as RetentionConfig}
                     onUpdate={updateConfigImmediate}
                  />
               )}
            </div>
            <div className="min-h-[400px]">
               <InsightPreview config={config} />
            </div>
         </div>
      </main>
   );
}
