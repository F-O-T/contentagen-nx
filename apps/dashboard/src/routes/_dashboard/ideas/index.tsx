import { IdeasListPage } from "@/pages/ideas-list/ui/ideas-list-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_dashboard/ideas/")({
   component: RouteComponent,
});

function RouteComponent() {
   return <IdeasListPage />;
}
