import { createErrorFallback } from "@packages/ui/components/error-fallback";
import { Skeleton } from "@packages/ui/components/skeleton";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
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
   return (
      <main className="flex flex-col gap-4">
         <div className="flex flex-col gap-2">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight font-serif leading-tight">
               Experimentos
            </h1>
            <p className="text-base md:text-lg text-muted-foreground font-sans leading-relaxed">
               Compare variantes de conteúdos e formulários com testes A/B
            </p>
         </div>
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
