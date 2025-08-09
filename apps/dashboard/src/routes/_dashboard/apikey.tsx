import { createFileRoute } from "@tanstack/react-router";
import { ApiKeyPage } from "@/pages/api-key/ui/api-key-page";

export const Route = createFileRoute("/_dashboard/apikey")({
   component: ApiKeyPage,
});
