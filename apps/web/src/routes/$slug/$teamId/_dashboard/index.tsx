import { createFileRoute, Outlet } from "@tanstack/react-router";
import { DashboardLayout } from "@/layout/dashboard/dashboard-layout";

export const Route = createFileRoute("/$slug/$teamId/_dashboard")({
   component: TeamDashboardLayoutRoute,
});

function TeamDashboardLayoutRoute() {
   return (
      <DashboardLayout>
         <Outlet />
      </DashboardLayout>
   );
}
