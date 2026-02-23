import { Button } from "@packages/ui/components/button";
import { createErrorFallback } from "@packages/ui/components/error-fallback";
import { Skeleton } from "@packages/ui/components/skeleton";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { Suspense } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { PageHeader } from "@/components/page-header";
import { FormsList } from "@/features/forms/ui/forms-list";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamSlug/_dashboard/forms/",
)({
   component: FormsPage,
});

function FormsPageErrorFallback(props: FallbackProps) {
   return createErrorFallback({
      errorDescription: "Não foi possível carregar a lista de formulários",
      errorTitle: "Erro ao carregar formulários",
      retryText: "Tentar novamente",
   })(props);
}

function FormsPageSkeleton() {
   return (
      <div className="space-y-2">
         <Skeleton className="h-12 w-full" />
         <Skeleton className="h-12 w-full" />
         <Skeleton className="h-12 w-full" />
         <Skeleton className="h-12 w-full" />
         <Skeleton className="h-12 w-full" />
      </div>
   );
}

function FormsPage() {
   const { slug, teamSlug } = Route.useParams();

   return (
      <main className="flex flex-col gap-4">
         <PageHeader
            actions={
               <Button asChild>
                  <Link
                     params={{ slug, teamSlug, formId: "new" }}
                     to="/$slug/$teamSlug/forms/$formId"
                  >
                     <Plus className="size-4 mr-1" />
                     Novo formulário
                  </Link>
               </Button>
            }
            description="Crie e gerencie formulários para coletar dados dos visitantes"
            title="Formulários"
         />
         <ErrorBoundary FallbackComponent={FormsPageErrorFallback}>
            <Suspense fallback={<FormsPageSkeleton />}>
               <FormsList />
            </Suspense>
         </ErrorBoundary>
      </main>
   );
}
