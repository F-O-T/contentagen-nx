import { createFileRoute } from "@tanstack/react-router";
import { ClusterBuilder } from "@/features/clusters/ui/cluster-builder";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamSlug/_dashboard/clusters/new",
)({
   component: NewClusterPage,
});

function NewClusterPage() {
   return <ClusterBuilder />;
}
