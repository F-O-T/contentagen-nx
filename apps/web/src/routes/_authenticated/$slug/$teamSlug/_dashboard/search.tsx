import { createFileRoute } from "@tanstack/react-router";
import { SearchPage } from "@/features/search/ui/search-page";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamSlug/_dashboard/search",
)({
   component: SearchPage,
});
