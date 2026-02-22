import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { ClusterDetailSection } from "@/features/clusters/ui/cluster-detail-section";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamSlug/_dashboard/clusters/$clusterId",
)({
   component: ClusterDetailPage,
});

function ClusterDetailPage() {
   return (
      <div className="p-6">
         <ErrorBoundary
            fallback={
               <p className="text-sm text-muted-foreground">
                  Erro ao carregar cluster.
               </p>
            }
         >
            <Suspense
               fallback={
                  <p className="text-sm text-muted-foreground">Carregando...</p>
               }
            >
               <ClusterDetailSection />
            </Suspense>
         </ErrorBoundary>
      </div>
   );
}
