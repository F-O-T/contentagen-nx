import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_dashboard")({
   component: RouteComponent,
   loader: async () => {},
});

import { Outlet } from "@tanstack/react-router";
import { DashboardLayout } from "@/layout/dashboard-layout";

function RouteComponent() {
   return (
      <DashboardLayout>
         <Outlet />
      </DashboardLayout>
   );
}
