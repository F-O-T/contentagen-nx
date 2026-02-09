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
import { Archive, CheckCircle, FileText, PenLine } from "lucide-react";
import { useMemo } from "react";
import { Cell, Label, Pie, PieChart } from "recharts";
import { orpc } from "@/integrations/orpc/client";

const statusChartConfig = {
	draft: { label: "Rascunhos", color: "hsl(45 93% 47%)" },
	published: { label: "Publicados", color: "hsl(142 71% 45%)" },
	archived: { label: "Arquivados", color: "hsl(215 16% 47%)" },
} satisfies ChartConfig;

export function HomeContentStatsCard({ className }: { className?: string }) {
	const options = useMemo(
		() =>
			orpc.content.listAllContent.queryOptions({
				input: {
					limit: 100,
					page: 1,
					status: ["draft", "published", "archived"],
				},
			}),
		[],
	);

	const { data } = useSuspenseQuery(options);

	const stats = {
		archived: data.items.filter((item) => item.status === "archived").length,
		draft: data.items.filter((item) => item.status === "draft").length,
		published: data.items.filter((item) => item.status === "published").length,
		total: data.total,
	};

	const statusData = [
		{ status: "draft", count: stats.draft, fill: "var(--color-draft)" },
		{ status: "published", count: stats.published, fill: "var(--color-published)" },
		{ status: "archived", count: stats.archived, fill: "var(--color-archived)" },
	];

	return (
		<Card className={cn(className)}>
			<CardHeader>
				<CardTitle>Visão Geral</CardTitle>
				<CardDescription>Seus conteúdos em resumo</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<ChartContainer config={statusChartConfig} className="mx-auto aspect-square h-[180px]">
					<PieChart>
						<ChartTooltip content={<ChartTooltipContent hideLabel />} />
						<Pie
							data={statusData}
							dataKey="count"
							nameKey="status"
							innerRadius={50}
							outerRadius={75}
							strokeWidth={2}
						>
							{statusData.map((entry) => (
								<Cell key={entry.status} fill={entry.fill} />
							))}
							<Label
								content={({ viewBox }) => {
									if (viewBox && "cx" in viewBox && "cy" in viewBox) {
										return (
											<text
												x={viewBox.cx}
												y={viewBox.cy}
												textAnchor="middle"
												dominantBaseline="middle"
											>
												<tspan
													x={viewBox.cx}
													y={viewBox.cy}
													className="fill-foreground text-2xl font-bold"
												>
													{stats.total}
												</tspan>
												<tspan
													x={viewBox.cx}
													y={(viewBox.cy || 0) + 18}
													className="fill-muted-foreground text-xs"
												>
													Total
												</tspan>
											</text>
										);
									}
								}}
							/>
						</Pie>
						<ChartLegend content={<ChartLegendContent nameKey="status" />} />
					</PieChart>
				</ChartContainer>

				<div className="grid grid-cols-2 gap-3">
					<Item size="sm" variant="muted" className="rounded-lg">
						<ItemMedia variant="icon">
							<FileText className="size-4" />
						</ItemMedia>
						<ItemContent>
							<ItemTitle className="text-xl font-bold tabular-nums">
								{stats.total}
							</ItemTitle>
							<ItemDescription>Total</ItemDescription>
						</ItemContent>
					</Item>

					<Item size="sm" variant="muted" className="rounded-lg">
						<ItemMedia variant="icon">
							<PenLine className="size-4" />
						</ItemMedia>
						<ItemContent>
							<ItemTitle className="text-xl font-bold tabular-nums">
								{stats.draft}
							</ItemTitle>
							<ItemDescription>Rascunhos</ItemDescription>
						</ItemContent>
					</Item>

					<Item size="sm" variant="muted" className="rounded-lg">
						<ItemMedia variant="icon">
							<CheckCircle className="size-4" />
						</ItemMedia>
						<ItemContent>
							<ItemTitle className="text-xl font-bold tabular-nums">
								{stats.published}
							</ItemTitle>
							<ItemDescription>Publicados</ItemDescription>
						</ItemContent>
					</Item>

					<Item size="sm" variant="muted" className="rounded-lg">
						<ItemMedia variant="icon">
							<Archive className="size-4" />
						</ItemMedia>
						<ItemContent>
							<ItemTitle className="text-xl font-bold tabular-nums">
								{stats.archived}
							</ItemTitle>
							<ItemDescription>Arquivados</ItemDescription>
						</ItemContent>
					</Item>
				</div>
			</CardContent>
		</Card>
	);
}
