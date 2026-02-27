import { Button } from "@packages/ui/components/button";
import {
   ContextPanel,
   ContextPanelContent,
   ContextPanelHeader,
   ContextPanelTitle,
} from "@packages/ui/components/context-panel";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { PageHeader } from "@/components/page-header";
import { ClustersListSection } from "@/features/clusters/ui/clusters-list-section";
import { ContextPanelAction } from "@/features/context-panel/context-panel-info";
import { useContextPanelInfo } from "@/features/context-panel/use-context-panel";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamSlug/_dashboard/clusters/",
)({
   component: ClustersPage,
});

function ClustersPage() {
   const navigate = useNavigate();
   const { slug, teamSlug } = Route.useParams();

   useContextPanelInfo(
      <ContextPanel>
         <ContextPanelHeader>
            <ContextPanelTitle>Ações</ContextPanelTitle>
         </ContextPanelHeader>
         <ContextPanelContent>
            <ContextPanelAction
               icon={Plus}
               label="Novo cluster"
               onClick={() =>
                  navigate({
                     to: "/$slug/$teamSlug/clusters/new",
                     params: { slug, teamSlug },
                  })
               }
            />
         </ContextPanelContent>
      </ContextPanel>,
   );

   return (
      <div className="space-y-6 p-6">
         <PageHeader
            actions={
               <Button
                  onClick={() =>
                     navigate({
                        to: "/$slug/$teamSlug/clusters/new",
                        params: { slug, teamSlug },
                     })
                  }
               >
                  <Plus className="size-4 mr-2" />
                  Novo cluster
               </Button>
            }
            description="Organize conteúdos relacionados em grupos temáticos"
            title="Clusters"
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
