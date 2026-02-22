import { Button } from "@packages/ui/components/button";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { PageHeader } from "@/components/page-header";
import { ClustersListSection } from "@/features/clusters/ui/clusters-list-section";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamSlug/_dashboard/clusters/",
)({
   component: ClustersPage,
});

function ClustersPage() {
   const navigate = useNavigate();
   const { slug, teamSlug } = Route.useParams();

   return (
      <div className="space-y-6 p-6">
         <PageHeader
            title="Clusters"
            description="Organize conteúdos relacionados em grupos temáticos"
            actions={
               <Button
                  onClick={() =>
                     navigate({
                        to: "/$slug/$teamSlug/clusters/new",
                        params: { slug, teamSlug },
                     } as never)
                  }
               >
                  <Plus className="size-4 mr-2" />
                  Novo cluster
               </Button>
            }
         />
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
