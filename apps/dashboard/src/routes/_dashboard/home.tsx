import { DashboardHomePage } from "@/pages/home/ui/home-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_dashboard/home")({
   component: RouteComponent,
});

function RouteComponent() {
   return <DashboardHomePage />;
}
