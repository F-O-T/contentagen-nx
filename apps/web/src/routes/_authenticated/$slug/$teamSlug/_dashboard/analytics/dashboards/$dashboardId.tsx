import { Skeleton } from "@packages/ui/components/skeleton";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";
import { DashboardView } from "@/features/analytics/ui/dashboard-view";
import { setChatMode } from "@/features/teco-chat/stores/chat-context-store";
import { orpc } from "@/integrations/orpc/client";
import { useSidebarSection } from "@/layout/dashboard/hooks/use-sidebar-nav";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamSlug/_dashboard/analytics/dashboards/$dashboardId",
)({
   loader: () => { setChatMode("analytics"); },
   component: DashboardViewPage,
});

function DashboardSkeleton() {
   return (
      <main className="flex flex-col gap-0">
         <div className="flex flex-col gap-2 pb-3">
            <div className="flex items-center gap-2">
               <Skeleton className="size-5 rounded" />
               <Skeleton className="h-7 w-64" />
            </div>
            <Skeleton className="h-4 w-96" />
         </div>
         <div className="grid grid-cols-12 gap-4">
            <Skeleton className="col-span-6 h-[300px]" />
            <Skeleton className="col-span-6 h-[300px]" />
            <Skeleton className="col-span-6 h-[300px]" />
            <Skeleton className="col-span-6 h-[300px]" />
         </div>
      </main>
   );
}

function DashboardViewPageContent() {
   const { dashboardId } = Route.useParams();
   const { data: dashboard } = useSuspenseQuery(
      orpc.dashboards.getById.queryOptions({ input: { id: dashboardId } }),
   );

   return <DashboardView dashboard={dashboard} />;
}

function DashboardViewPage() {
   useSidebarSection("dashboards");
   return (
      <Suspense fallback={<DashboardSkeleton />}>
         <DashboardViewPageContent />
      </Suspense>
   );
}
