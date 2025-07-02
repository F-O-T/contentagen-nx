import { createFileRoute } from "@tanstack/react-router";
import { EditContentRequestPage } from "@/pages/edit-content-request/ui/edit-content-request-page";

export const Route = createFileRoute(
   "/_dashboard/content/requests/$requestId/edit",
)({
   component: RouteComponent,
});
function RouteComponent() {
   return <EditContentRequestPage />;
}
