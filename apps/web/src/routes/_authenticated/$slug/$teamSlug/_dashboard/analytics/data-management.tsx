import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useSidebarSection } from "@/layout/dashboard/hooks/use-sidebar-nav";
import { DataManagementLayout } from "@/layout/dashboard/ui/data-management-layout";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamSlug/_dashboard/analytics/data-management",
)({
   component: DataManagementLayoutRoute,
});

function DataManagementLayoutRoute() {
   useSidebarSection("data-management");
   return (
      <DataManagementLayout>
         <Outlet />
      </DataManagementLayout>
   );
}
