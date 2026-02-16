import { createFileRoute, Outlet } from "@tanstack/react-router";
import { DataManagementLayout } from "@/layout/dashboard/ui/data-management-layout";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamId/_dashboard/analytics/data-management",
)({
   component: DataManagementLayoutRoute,
});

function DataManagementLayoutRoute() {
   return (
      <DataManagementLayout>
         <Outlet />
      </DataManagementLayout>
   );
}
