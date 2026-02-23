// apps/web/src/routes/_authenticated/$slug/$teamSlug/_dashboard/experiments/$experimentId.tsx
import { createFileRoute } from "@tanstack/react-router";
import { ExperimentBuilder } from "@/features/experiments/ui/experiment-builder";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamSlug/_dashboard/experiments/$experimentId",
)({
   component: ExperimentDetailPage,
});

function ExperimentDetailPage() {
   const { experimentId } = Route.useParams();

   return <ExperimentBuilder experimentId={experimentId} />;
}
