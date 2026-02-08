import { Button } from "@packages/ui/components/button";
import { Skeleton } from "@packages/ui/components/skeleton";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Plus, RefreshCw } from "lucide-react";
import { Suspense, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { DashboardTile as DashboardTileType } from "@packages/database/schemas/dashboards";
import { DashboardGrid } from "@/features/analytics/ui/dashboard-grid";
import { DashboardTile } from "@/features/analytics/ui/dashboard-tile";
import { TrendsLineChart } from "@/features/analytics/charts/trends-line-chart";
import { orpc } from "@/integrations/orpc/client";

export const Route = createFileRoute(
	"/_authenticated/$slug/_dashboard/analytics/dashboards/$dashboardId",
)({
	component: DashboardViewPage,
});

function DashboardSkeleton() {
	return (
		<div className="grid grid-cols-12 gap-4">
			<Skeleton className="col-span-6 h-[300px]" />
			<Skeleton className="col-span-6 h-[300px]" />
			<Skeleton className="col-span-12 h-[300px]" />
		</div>
	);
}

function DashboardContent() {
	const { dashboardId } = Route.useParams();
	const { data: dashboard } = useSuspenseQuery(
		orpc.dashboards.getById.queryOptions({ input: { id: dashboardId } }),
	);
	const [tiles, setTiles] = useState<DashboardTileType[]>(
		(dashboard.tiles as DashboardTileType[]) ?? [],
	);

	const sampleData = Array.from({ length: 30 }, (_, i) => ({
		date: `Day ${i + 1}`,
		views: Math.floor(Math.random() * 500) + 100,
	}));

	if (tiles.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-16 text-center border rounded-lg border-dashed">
				<h2 className="text-lg font-semibold mb-2">Dashboard vazio</h2>
				<p className="text-muted-foreground mb-4 max-w-md">
					Adicione insights para começar a montar seu dashboard.
				</p>
				<Button>
					<Plus className="size-4 mr-1" />
					Adicionar insight
				</Button>
			</div>
		);
	}

	return (
		<DashboardGrid
			tiles={tiles}
			onReorder={setTiles}
			renderTile={(tile) => (
				<DashboardTile
					key={tile.insightId}
					id={tile.insightId}
					insightName="Sample Insight"
					size={tile.size}
				>
					<TrendsLineChart
						data={sampleData}
						series={[
							{
								key: "views",
								label: "Views",
								color: "hsl(var(--chart-1))",
							},
						]}
						xAxisKey="date"
						height={200}
					/>
				</DashboardTile>
			)}
		/>
	);
}

function DashboardViewPage() {
	const { slug } = Route.useParams();
	return (
		<main className="flex flex-col gap-4">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<Link to="/$slug/analytics/dashboards" params={{ slug }}>
						<Button variant="ghost" size="icon">
							<ArrowLeft className="size-4" />
						</Button>
					</Link>
					<h1 className="text-2xl font-bold tracking-tight font-serif">
						Dashboard
					</h1>
				</div>
				<div className="flex items-center gap-2">
					<Button variant="outline" size="sm">
						<RefreshCw className="size-4 mr-1" />
						Refresh
					</Button>
					<Button size="sm">
						<Plus className="size-4 mr-1" />
						Add insight
					</Button>
				</div>
			</div>
			<Suspense fallback={<DashboardSkeleton />}>
				<DashboardContent />
			</Suspense>
		</main>
	);
}
