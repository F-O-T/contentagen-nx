import { Card, CardContent, CardHeader, CardTitle } from "@packages/ui/components/card";
import type { FunnelsConfig, InsightConfig, InsightType, RetentionConfig, TrendsConfig } from "../hooks/use-insight-config";
import { FunnelChart } from "../charts/funnel-chart";
import { RetentionGrid } from "../charts/retention-grid";
import { TrendsBarChart } from "../charts/trends-bar-chart";
import { TrendsLineChart } from "../charts/trends-line-chart";
import { TrendsNumberCard } from "../charts/trends-number-card";

interface InsightPreviewProps { type: InsightType; config: InsightConfig; }

function generateTrendsSampleData() {
	const days = [];
	const now = new Date();
	for (let i = 29; i >= 0; i--) {
		const date = new Date(now);
		date.setDate(date.getDate() - i);
		days.push({ date: date.toISOString().split("T")[0], "content.page.view": Math.floor(Math.random() * 500) + 100 });
	}
	return days;
}

function generateFunnelSampleData(steps: FunnelsConfig["steps"]) {
	let count = 1000;
	return steps.map((step) => {
		const result = { name: step.event || step.label, count };
		count = Math.floor(count * (0.4 + Math.random() * 0.4));
		return result;
	});
}

function generateRetentionSampleData() {
	const cohorts = [];
	const now = new Date();
	for (let i = 5; i >= 0; i--) {
		const date = new Date(now);
		date.setDate(date.getDate() - i * 7);
		const size = Math.floor(Math.random() * 200) + 50;
		const values = [];
		let retained = size;
		for (let j = 0; j < 6 - i; j++) {
			retained = Math.floor(retained * (0.5 + Math.random() * 0.3));
			values.push(retained);
		}
		cohorts.push({ cohort: date.toLocaleDateString("pt-BR", { month: "short", day: "numeric" }), size, values });
	}
	return cohorts;
}

function TrendsPreview({ config }: { config: TrendsConfig }) {
	const data = generateTrendsSampleData();
	const series = config.events.filter((e) => e.name).map((e, i) => ({ key: e.name, label: e.label || e.name, color: `hsl(var(--chart-${i + 1}))` }));
	if (series.length === 0) return <div className="flex items-center justify-center h-64 text-muted-foreground">Add an event to see a preview</div>;
	if (config.chartType === "number") {
		const total = data.reduce((sum, d) => sum + (((d as Record<string, unknown>)[series[0].key] as number) ?? 0), 0);
		return <TrendsNumberCard value={total} label={series[0].label} trend={{ value: 12, direction: "up", comparison: "vs previous period" }} />;
	}
	if (config.chartType === "bar") return <TrendsBarChart data={data} series={series} xAxisKey="date" xAxisFormatter={(v) => new Date(v).toLocaleDateString("pt-BR", { day: "numeric" })} />;
	return <TrendsLineChart data={data} series={series} xAxisKey="date" xAxisFormatter={(v) => new Date(v).toLocaleDateString("pt-BR", { day: "numeric" })} />;
}

function FunnelsPreview({ config }: { config: FunnelsConfig }) {
	if (config.steps.length < 2) return <div className="flex items-center justify-center h-64 text-muted-foreground">Add at least 2 steps to see a preview</div>;
	return <FunnelChart steps={generateFunnelSampleData(config.steps)} />;
}

function RetentionPreview({ config }: { config: RetentionConfig }) {
	const data = generateRetentionSampleData();
	const periodLabels = config.period === "day" ? ["Day 1","Day 2","Day 3","Day 4","Day 5"] : config.period === "week" ? ["Week 1","Week 2","Week 3","Week 4","Week 5"] : ["Month 1","Month 2","Month 3","Month 4","Month 5"];
	return <RetentionGrid data={data} periods={periodLabels} />;
}

export function InsightPreview({ type, config }: InsightPreviewProps) {
	return (
		<Card className="h-full">
			<CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground">Preview</CardTitle></CardHeader>
			<CardContent>
				{type === "trends" && <TrendsPreview config={config as TrendsConfig} />}
				{type === "funnels" && <FunnelsPreview config={config as FunnelsConfig} />}
				{type === "retention" && <RetentionPreview config={config as RetentionConfig} />}
			</CardContent>
		</Card>
	);
}
