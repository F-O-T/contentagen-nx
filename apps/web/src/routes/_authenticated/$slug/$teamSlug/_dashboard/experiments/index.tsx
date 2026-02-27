import {
   ContextPanel,
   ContextPanelContent,
   ContextPanelHeader,
   ContextPanelTitle,
} from "@packages/ui/components/context-panel";
import { createErrorFallback } from "@packages/ui/components/error-fallback";
import { Skeleton } from "@packages/ui/components/skeleton";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { Suspense } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { PageHeader } from "@/components/page-header";
import { ContextPanelAction } from "@/features/context-panel/context-panel-info";
import { useContextPanelInfo } from "@/features/context-panel/use-context-panel";
import { ExperimentsListSection } from "@/features/experiments/ui/experiments-list-section";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamSlug/_dashboard/experiments/",
)({
   component: ExperimentsPage,
});

function ExperimentsPageErrorFallback(props: FallbackProps) {
   return createErrorFallback({
      errorDescription: "Não foi possível carregar os experimentos",
      errorTitle: "Erro ao carregar experimentos",
      retryText: "Tentar novamente",
   })(props);
}

function ExperimentsPageSkeleton() {
   return (
      <main className="flex flex-col gap-4">
         <div className="flex flex-col gap-2">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-5 w-80" />
         </div>
         <Skeleton className="h-[300px]" />
      </main>
   );
}

function ExperimentsPageContent() {
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
               label="Novo experimento"
               onClick={() =>
                  navigate({
                     to: "/$slug/$teamSlug/experiments/new",
                     params: { slug, teamSlug },
                  })
               }
            />
         </ContextPanelContent>
      </ContextPanel>,
   );

   return (
      <main className="flex flex-col gap-4">
         <PageHeader
            description="Compare variantes de conteúdos e formulários com testes A/B"
            title="Experimentos"
         />
         <ExperimentsListSection />
      </main>
   );
}

function ExperimentsPage() {
   return (
      <ErrorBoundary FallbackComponent={ExperimentsPageErrorFallback}>
         <Suspense fallback={<ExperimentsPageSkeleton />}>
            <ExperimentsPageContent />
         </Suspense>
      </ErrorBoundary>
   );
}
