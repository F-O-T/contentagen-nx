import {
	type ChartConfig,
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
} from "@packages/ui/components/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

interface TrendsBarChartProps {
	data: Array<Record<string, unknown>>;
	series: Array<{ key: string; label: string; color: string }>;
	xAxisKey: string;
	height?: number;
	xAxisFormatter?: (value: string) => string;
}

export function TrendsBarChart({
	data,
	series,
	xAxisKey,
	height = 300,
	xAxisFormatter,
}: TrendsBarChartProps) {
	const chartConfig: ChartConfig = {};
	for (const s of series) {
		chartConfig[s.key] = { label: s.label, color: s.color };
	}

	return (
		<ChartContainer
			config={chartConfig}
			className="w-full"
			style={{ height }}
		>
			<BarChart
				data={data}
				margin={{ top: 10, right: 10, bottom: 0, left: 0 }}
			>
				<CartesianGrid
					strokeDasharray="3 3"
					vertical={false}
					className="stroke-muted"
				/>
				<XAxis
					dataKey={xAxisKey}
					tickLine={false}
					axisLine={false}
					tickMargin={8}
					tickFormatter={xAxisFormatter}
					className="text-xs"
				/>
				<YAxis
					tickLine={false}
					axisLine={false}
					tickMargin={8}
					width={40}
					className="text-xs"
				/>
				{series.map((s) => (
					<Bar
						key={s.key}
						dataKey={s.key}
						fill={`var(--color-${s.key})`}
						radius={[4, 4, 0, 0]}
					/>
				))}
				<ChartTooltip content={<ChartTooltipContent />} />
				<ChartLegend content={<ChartLegendContent />} />
			</BarChart>
		</ChartContainer>
	);
}
