import { Button } from "@packages/ui/components/button";
import { createFileRoute } from "@tanstack/react-router";
import { Network, Plus } from "lucide-react";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useSheet } from "@/hooks/use-sheet";
import { ClustersListSection } from "@/features/clusters/ui/clusters-list-section";
import { CreateClusterSheet } from "@/features/clusters/ui/create-cluster-sheet";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamSlug/_dashboard/clusters/",
)({
   component: ClustersPage,
});

function ClustersPage() {
   const { openSheet } = useSheet();

   return (
      <div className="space-y-6 p-6">
         <div className="flex items-center justify-between">
            <div>
               <h1 className="text-2xl font-semibold font-serif flex items-center gap-2">
                  <Network className="size-6" />
                  Clusters
               </h1>
               <p className="text-sm text-muted-foreground mt-1">
                  Organize conteúdos relacionados em grupos temáticos.
               </p>
            </div>
            <Button
               onClick={() => openSheet({ children: <CreateClusterSheet /> })}
            >
               <Plus className="size-4 mr-2" />
               Novo cluster
            </Button>
         </div>
         <ErrorBoundary
            fallback={
               <p className="text-sm text-muted-foreground">
                  Erro ao carregar clusters.
               </p>
            }
         >
            <Suspense
               fallback={
                  <p className="text-sm text-muted-foreground">Carregando...</p>
               }
            >
               <ClustersListSection />
            </Suspense>
         </ErrorBoundary>
      </div>
   );
}
