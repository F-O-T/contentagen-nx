import {
	type ChartConfig,
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
} from "@packages/ui/components/chart";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

interface TrendsLineChartProps {
	data: Array<Record<string, unknown>>;
	series: Array<{ key: string; label: string; color: string }>;
	xAxisKey: string;
	height?: number;
	xAxisFormatter?: (value: string) => string;
}

export function TrendsLineChart({
	data,
	series,
	xAxisKey,
	height = 300,
	xAxisFormatter,
}: TrendsLineChartProps) {
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
			<LineChart
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
					<Line
						key={s.key}
						type="monotone"
						dataKey={s.key}
						stroke={`var(--color-${s.key})`}
						strokeWidth={2}
						dot={{ r: 3 }}
					/>
				))}
				<ChartTooltip content={<ChartTooltipContent />} />
				<ChartLegend content={<ChartLegendContent />} />
			</LineChart>
		</ChartContainer>
	);
}
