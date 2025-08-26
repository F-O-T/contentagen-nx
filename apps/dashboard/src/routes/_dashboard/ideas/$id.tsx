import { createFileRoute } from "@tanstack/react-router";

import { IdeaDetailsPage } from "@/pages/idea-details/ui/idea-details-page";
export const Route = createFileRoute("/_dashboard/ideas/$id")({
   component: RouteComponent,
});

function RouteComponent() {
   return <IdeaDetailsPage />;
}
