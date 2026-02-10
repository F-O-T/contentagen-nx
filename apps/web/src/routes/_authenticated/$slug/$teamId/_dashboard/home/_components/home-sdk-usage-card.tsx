import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@packages/ui/components/card";
import {
	type ChartConfig,
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
} from "@packages/ui/components/chart";
import {
	Item,
	ItemContent,
	ItemDescription,
	ItemMedia,
	ItemTitle,
} from "@packages/ui/components/item";
import { cn } from "@packages/ui/lib/utils";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Activity, AlertTriangle, Clock, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { orpc } from "@/integrations/orpc/client";

const chartConfig = {
	author: { label: "Autor", color: "hsl(var(--chart-1))" },
	list: { label: "Listagem", color: "hsl(var(--chart-2))" },
	content: { label: "Conteúdo", color: "hsl(var(--chart-3))" },
	image: { label: "Imagem", color: "hsl(var(--chart-4))" },
} satisfies ChartConfig;

export function HomeSDKUsageCard({ className }: { className?: string }) {
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	// Get last 6 months of data for the chart
	const now = new Date();
	const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
	const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

	const { data: monthlyData } = useSuspenseQuery(
		orpc.sdkUsage.getSDKUsageByMonth.queryOptions({
			input: {
				startDate: sixMonthsAgo,
				endDate: endOfMonth,
			},
		}),
	);

	const { data: currentMonth } = useSuspenseQuery(
		orpc.sdkUsage.getCurrentMonthSDKUsage.queryOptions(),
	);

	const totalEndpointRequests =
		currentMonth.byEndpoint.author +
		currentMonth.byEndpoint.list +
		currentMonth.byEndpoint.content +
		currentMonth.byEndpoint.image;

	// Generate placeholder data for last 6 months if no data exists
	const generatePlaceholderData = () => {
		const now = new Date();
		const months = [];
		for (let i = 5; i >= 0; i--) {
			const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
			months.push({
				month: date.toLocaleDateString("pt-BR", { month: "short" }),
				author: 0,
				list: 0,
				content: 0,
				image: 0,
			});
		}
		return months;
	};

	const hasApiData = monthlyData.length > 0 && monthlyData.some(m => 
		m.byEndpoint.author > 0 || m.byEndpoint.list > 0 || m.byEndpoint.content > 0 || m.byEndpoint.image > 0
	);

	const chartData = hasApiData 
		? monthlyData.map((month) => ({
				month: new Date(month.period).toLocaleDateString("pt-BR", { month: "short" }),
				author: month.byEndpoint.author,
				list: month.byEndpoint.list,
				content: month.byEndpoint.content,
				image: month.byEndpoint.image,
			}))
		: generatePlaceholderData();

	return (
		<Card className={cn(className)}>
			<CardHeader>
				<CardTitle>Uso do SDK</CardTitle>
				<CardDescription>
					Estatísticas de uso da API neste mês
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				{mounted ? (
					<ChartContainer config={chartConfig} className="h-[200px] w-full">
						<LineChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
							<CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
							<XAxis 
								dataKey="month" 
								tickLine={false}
								axisLine={false}
								tickMargin={8}
								className="text-xs"
							/>
							<YAxis 
								tickLine={false}
								axisLine={false}
								tickMargin={8}
								width={40}
								className="text-xs"
							/>
							<Line
								type="monotone"
								dataKey="author"
								stroke="var(--color-author)"
								strokeWidth={2}
								dot={{ r: 3 }}
							/>
							<Line
								type="monotone"
								dataKey="list"
								stroke="var(--color-list)"
								strokeWidth={2}
								dot={{ r: 3 }}
							/>
							<Line
								type="monotone"
								dataKey="content"
								stroke="var(--color-content)"
								strokeWidth={2}
								dot={{ r: 3 }}
							/>
							<Line
								type="monotone"
								dataKey="image"
								stroke="var(--color-image)"
								strokeWidth={2}
								dot={{ r: 3 }}
							/>
							<ChartTooltip content={<ChartTooltipContent />} />
							<ChartLegend content={<ChartLegendContent />} />
						</LineChart>
					</ChartContainer>
				) : (
					<div className="h-[200px] w-full" />
				)}

				<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
					<Item size="sm" variant="muted" className="rounded-lg">
						<ItemMedia variant="icon">
							<Zap className="size-4" />
						</ItemMedia>
						<ItemContent>
							<ItemTitle className="text-xl font-bold tabular-nums">
								{currentMonth.totalRequests.toLocaleString("pt-BR")}
							</ItemTitle>
							<ItemDescription>Total de Requisições</ItemDescription>
						</ItemContent>
					</Item>

					<Item size="sm" variant="muted" className="rounded-lg">
						<ItemMedia variant="icon">
							<Activity className="size-4" />
						</ItemMedia>
						<ItemContent>
							<ItemTitle className="text-xl font-bold tabular-nums">
								{totalEndpointRequests.toLocaleString("pt-BR")}
							</ItemTitle>
							<ItemDescription>Buscas de Conteúdo</ItemDescription>
						</ItemContent>
					</Item>

					<Item size="sm" variant="muted" className="rounded-lg">
						<ItemMedia variant="icon">
							<Clock className="size-4" />
						</ItemMedia>
						<ItemContent>
							<ItemTitle className="text-xl font-bold tabular-nums">
								{Math.round(currentMonth.performance.avgLatencyMs)}ms
							</ItemTitle>
							<ItemDescription>Latência Média</ItemDescription>
						</ItemContent>
					</Item>

					<Item size="sm" variant="muted" className="rounded-lg">
						<ItemMedia variant="icon">
							<AlertTriangle className="size-4" />
						</ItemMedia>
						<ItemContent>
							<ItemTitle className="text-xl font-bold tabular-nums">
								{currentMonth.errors.total.toLocaleString("pt-BR")}
							</ItemTitle>
							<ItemDescription>Erros</ItemDescription>
						</ItemContent>
					</Item>
				</div>
			</CardContent>
		</Card>
	);
}
