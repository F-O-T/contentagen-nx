import type { DashboardTile as DashboardTileType } from "@packages/database/schemas/dashboards";
import { Button } from "@packages/ui/components/button";
import { Skeleton } from "@packages/ui/components/skeleton";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
   ArrowLeft,
   Calendar,
   Clock,
   LayoutDashboard,
   Pencil,
   Plus,
   RefreshCw,
} from "lucide-react";
import { Suspense, useState } from "react";
import { TrendsLineChart } from "@/features/analytics/charts/trends-line-chart";
import { DashboardGrid } from "@/features/analytics/ui/dashboard-grid";
import { DashboardTile } from "@/features/analytics/ui/dashboard-tile";
import { orpc } from "@/integrations/orpc/client";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamSlug/_dashboard/analytics/dashboards/$dashboardId",
)({
   component: DashboardViewPage,
});

function DashboardSkeleton() {
   return (
      <div className="grid grid-cols-12 gap-4">
         <Skeleton className="col-span-6 h-[300px]" />
         <Skeleton className="col-span-6 h-[300px]" />
         <Skeleton className="col-span-6 h-[300px]" />
         <Skeleton className="col-span-6 h-[300px]" />
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
         onReorder={setTiles}
         renderTile={(tile) => (
            <DashboardTile
               id={tile.insightId}
               insightName="Sample Insight"
               key={tile.insightId}
               size={tile.size}
            >
               <TrendsLineChart
                  data={sampleData}
                  height={200}
                  series={[
                     {
                        key: "views",
                        label: "Views",
                        color: "var(--chart-1)",
                     },
                  ]}
                  xAxisKey="date"
               />
            </DashboardTile>
         )}
         tiles={tiles}
      />
   );
}

// =============================================================================
// Dashboard Header (PostHog-style)
// =============================================================================

function DashboardPageHeader({
   name,
   description,
   backTo,
}: {
   name: string;
   description?: string | null;
   backTo: { slug: string; teamSlug: string };
}) {
   return (
      <div className="flex flex-col gap-0">
         {/* Title row */}
         <div className="flex items-center justify-between gap-4 pb-1">
            <div className="flex items-center gap-2 min-w-0">
               <Link
                  params={backTo as never}
                  to={"/$slug/$teamSlug/analytics/dashboards" as never}
               >
                  <Button className="size-7" size="icon" variant="ghost">
                     <ArrowLeft className="size-4" />
                  </Button>
               </Link>
               <LayoutDashboard className="size-5 text-muted-foreground shrink-0" />
               <h1 className="text-lg font-semibold tracking-tight truncate">
                  {name}
               </h1>
               <Button className="size-6" size="icon" variant="ghost">
                  <Pencil className="size-3" />
               </Button>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
               <Button size="sm" variant="outline">
                  <Plus className="size-3.5" />
                  Add insight
               </Button>
            </div>
         </div>

         {/* Description */}
         {description && (
            <p className="text-sm text-muted-foreground pb-3 pl-16">
               {description}
            </p>
         )}

         {/* Filter bar */}
         <div className="flex items-center justify-between gap-3 border-t border-b py-2">
            <div className="flex items-center gap-1.5">
               <Button
                  className="h-7 text-xs gap-1.5 text-muted-foreground"
                  size="sm"
                  variant="outline"
               >
                  <Calendar className="size-3.5" />
                  No date range override
               </Button>
               <Button
                  className="h-7 text-xs gap-1 text-muted-foreground"
                  size="sm"
                  variant="outline"
               >
                  <Plus className="size-3" />
                  Filter
               </Button>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
               <span className="hidden sm:inline-flex items-center gap-1">
                  <Clock className="size-3" />
                  Last refreshed just now
               </span>
               <Button
                  className="h-7 text-xs gap-1.5"
                  size="sm"
                  variant="outline"
               >
                  <RefreshCw className="size-3" />
                  Refresh
               </Button>
            </div>
         </div>
      </div>
   );
}

function DashboardViewPageContent() {
   const { slug, teamSlug, dashboardId } = Route.useParams();
   const { data: dashboard } = useSuspenseQuery(
      orpc.dashboards.getById.queryOptions({ input: { id: dashboardId } }),
   );

   return (
      <main className="flex flex-col gap-0">
         <DashboardPageHeader
            backTo={{ slug, teamSlug }}
            description={dashboard.description}
            name={dashboard.name}
         />
         <div className="pt-4">
            <DashboardContent />
         </div>
      </main>
   );
}

function DashboardViewPage() {
   return (
      <Suspense
         fallback={
            <main className="flex flex-col gap-0">
               <div className="flex flex-col gap-2 pb-3">
                  <div className="flex items-center gap-2">
                     <Skeleton className="size-5 rounded" />
                     <Skeleton className="h-7 w-64" />
                  </div>
                  <Skeleton className="h-4 w-96" />
               </div>
               <div className="border-t border-b py-2 mb-4">
                  <Skeleton className="h-7 w-44" />
               </div>
               <DashboardSkeleton />
            </main>
         }
      >
         <DashboardViewPageContent />
      </Suspense>
   );
}
