import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { ClusterBuilder } from "@/features/clusters/ui/cluster-builder";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamSlug/_dashboard/clusters/$clusterId",
)({
   component: ClusterDetailPage,
});

function ClusterDetailPage() {
   const { clusterId } = Route.useParams();

   return (
      <ErrorBoundary
         fallback={
            <p className="text-sm text-muted-foreground p-6">
               Erro ao carregar cluster.
            </p>
         }
      >
         <Suspense
            fallback={
               <p className="text-sm text-muted-foreground p-6">
                  Carregando...
               </p>
            }
         >
            <ClusterBuilder clusterId={clusterId} />
         </Suspense>
      </ErrorBoundary>
   );
}
