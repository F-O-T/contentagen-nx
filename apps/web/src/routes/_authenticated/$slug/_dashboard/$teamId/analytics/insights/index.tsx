import { Input } from "@packages/ui/components/input";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useInsightConfig } from "@/features/analytics/hooks/use-insight-config";
import { FunnelsQueryBuilder } from "@/features/analytics/ui/funnels-query-builder";
import { InsightPreview } from "@/features/analytics/ui/insight-preview";
import { InsightTabBar } from "@/features/analytics/ui/insight-tab-bar";
import { RetentionQueryBuilder } from "@/features/analytics/ui/retention-query-builder";
import { TrendsQueryBuilder } from "@/features/analytics/ui/trends-query-builder";
import type { FunnelsConfig, RetentionConfig, TrendsConfig } from "@/features/analytics/hooks/use-insight-config";

export const Route = createFileRoute(
	"/_authenticated/$slug/_dashboard/$teamId/analytics/insights/",
)({
	component: InsightsPage,
});

function InsightsPage() {
	const { type, config, setType, updateConfigImmediate } = useInsightConfig();
	const [insightName, setInsightName] = useState("");

	const handleSave = () => {
		// TODO: call orpc.insights.create
		console.log("Save insight:", { name: insightName, type, config });
	}

	return (
		<main className="flex flex-col gap-4 h-full">
			<div className="flex flex-col gap-2">
				<h1 className="text-3xl md:text-4xl font-bold tracking-tight font-serif leading-tight">Novo Insight</h1>
				<Input placeholder="Nome do insight (ex: Visualizações por conteúdo)" value={insightName} onChange={(e) => setInsightName(e.target.value)} className="max-w-md" />
			</div>
			<InsightTabBar activeTab={type} onTabChange={setType} onSave={handleSave} />
			<div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 flex-1 min-h-0">
				<div className="overflow-y-auto border rounded-lg p-4 bg-card">
					{type === "trends" && <TrendsQueryBuilder config={config as TrendsConfig} onUpdate={updateConfigImmediate} />}
					{type === "funnels" && <FunnelsQueryBuilder config={config as FunnelsConfig} onUpdate={updateConfigImmediate} />}
					{type === "retention" && <RetentionQueryBuilder config={config as RetentionConfig} onUpdate={updateConfigImmediate} />}
				</div>
				<div className="min-h-[400px]">
					<InsightPreview type={type} config={config} />
				</div>
			</div>
		</main>
	)
}
