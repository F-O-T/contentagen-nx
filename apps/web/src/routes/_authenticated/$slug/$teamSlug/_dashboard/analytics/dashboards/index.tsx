import { Button } from "@packages/ui/components/button";
import { Skeleton } from "@packages/ui/components/skeleton";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { LayoutDashboard, Plus } from "lucide-react";
import { Suspense } from "react";
import { DashboardListCard } from "@/features/analytics/ui/dashboard-list-card";
import { orpc } from "@/integrations/orpc/client";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamSlug/_dashboard/analytics/dashboards/",
)({
   component: DashboardsPage,
});

function DashboardsPageSkeleton() {
   return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
         {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton className="h-[120px]" key={`dash-skeleton-${i + 1}`} />
         ))}
      </div>
   );
}

function DashboardsList() {
   const { slug, teamId } = Route.useParams();
   const { data: dashboards } = useSuspenseQuery(
      orpc.dashboards.list.queryOptions({}),
   );

   if (dashboards.length === 0) {
      return (
         <div className="flex flex-col items-center justify-center py-16 text-center">
            <LayoutDashboard className="size-12 text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold mb-2">
               Nenhum dashboard ainda
            </h2>
            <p className="text-muted-foreground mb-4 max-w-md">
               Crie seu primeiro dashboard para organizar seus insights em um
               painel visual.
            </p>
            <Button>
               <Plus className="size-4 mr-1" />
               Novo dashboard
            </Button>
         </div>
      );
   }

   return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
         {dashboards.map((dashboard) => (
            <DashboardListCard
               description={dashboard.description}
               id={dashboard.id}
               key={dashboard.id}
               name={dashboard.name}
               slug={slug}
               teamId={teamId}
               tileCount={
                  Array.isArray(dashboard.tiles) ? dashboard.tiles.length : 0
               }
               updatedAt={dashboard.updatedAt.toString()}
            />
         ))}
      </div>
   );
}

function DashboardsPage() {
   return (
      <main className="flex flex-col gap-4">
         <div className="flex items-center justify-between">
            <div className="flex flex-col gap-2">
               <h1 className="text-3xl md:text-4xl font-bold tracking-tight font-serif leading-tight">
                  Dashboards
               </h1>
               <p className="text-base md:text-lg text-muted-foreground font-sans leading-relaxed">
                  Painéis personalizados com seus insights
               </p>
            </div>
            <Button>
               <Plus className="size-4 mr-1" />
               Novo dashboard
            </Button>
         </div>
         <Suspense fallback={<DashboardsPageSkeleton />}>
            <DashboardsList />
         </Suspense>
      </main>
   );
}
