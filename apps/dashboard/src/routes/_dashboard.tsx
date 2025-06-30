import { createFileRoute, useLocation } from "@tanstack/react-router";

export const Route = createFileRoute("/_dashboard")({
   component: RouteComponent,
   loader: async () => {},
});

import { Outlet } from "@tanstack/react-router";
import { DashboardLayout } from "@/layout/dashboard-layout";

function RouteComponent() {
   const location = useLocation();
   return (
      <DashboardLayout>
         <div
            className="duration-700 animate-in slide-in-from-bottom-4 fade-in h-full w-full"
            key={location.pathname}
         >
            <Outlet />
         </div>
      </DashboardLayout>
   );
}
