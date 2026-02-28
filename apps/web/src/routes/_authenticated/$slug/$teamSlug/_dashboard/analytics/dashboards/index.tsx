import { Button } from "@packages/ui/components/button";
import {
   ContextPanel,
   ContextPanelContent,
   ContextPanelHeader,
   ContextPanelTitle,
} from "@packages/ui/components/context-panel";
import { Skeleton } from "@packages/ui/components/skeleton";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { LayoutDashboard, Plus } from "lucide-react";
import { Suspense } from "react";
import { PageHeader } from "@/components/page-header";
import { DashboardListCard } from "@/features/analytics/ui/dashboard-list-card";
import { ContextPanelAction } from "@/features/context-panel/context-panel-info";
import { useContextPanelInfo } from "@/features/context-panel/use-context-panel";
import { setChatMode } from "@/features/teco-chat/stores/chat-context-store";
import { orpc } from "@/integrations/orpc/client";
import { useSidebarSection } from "@/layout/dashboard/hooks/use-sidebar-nav";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamSlug/_dashboard/analytics/dashboards/",
)({
   loader: () => { setChatMode("analytics"); },
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
   const { slug, teamSlug } = Route.useParams();
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
               isDefault={dashboard.isDefault}
               key={dashboard.id}
               name={dashboard.name}
               slug={slug}
               teamSlug={teamSlug}
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
   useSidebarSection("dashboards");
   useContextPanelInfo(
      <ContextPanel>
         <ContextPanelHeader>
            <ContextPanelTitle>Ações</ContextPanelTitle>
         </ContextPanelHeader>
         <ContextPanelContent>
            <ContextPanelAction
               icon={Plus}
               label="Novo dashboard"
               onClick={() => {
                  // TODO: Wire to create dashboard action
               }}
            />
         </ContextPanelContent>
      </ContextPanel>,
   );

   return (
      <main className="flex flex-col gap-4">
         <PageHeader
            actions={
               <Button>
                  <Plus className="size-4 mr-1" />
                  Novo dashboard
               </Button>
            }
            description="Painéis personalizados com seus insights"
            title="Dashboards"
         />
         <Suspense fallback={<DashboardsPageSkeleton />}>
            <DashboardsList />
         </Suspense>
      </main>
   );
}
