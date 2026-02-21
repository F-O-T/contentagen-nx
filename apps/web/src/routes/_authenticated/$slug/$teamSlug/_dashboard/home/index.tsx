import { createErrorFallback } from "@packages/ui/components/error-fallback";
import { Skeleton } from "@packages/ui/components/skeleton";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { DashboardView } from "@/features/analytics/ui/dashboard-view";
import { QuickStartChecklist } from "@/features/onboarding/ui/quick-start-checklist";
import { orpc } from "@/integrations/orpc/client";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamSlug/_dashboard/home/",
)({
   component: HomePage,
});

// =============================================================================
// Error & Loading States
// =============================================================================

function HomePageErrorFallback(props: FallbackProps) {
   return createErrorFallback({
      errorDescription: "Não foi possível carregar o dashboard",
      errorTitle: "Erro ao carregar dashboard",
      retryText: "Tentar novamente",
   })(props);
}

function HomePageSkeleton() {
   return (
      <main className="flex flex-col gap-0">
         <div className="flex flex-col gap-2 pb-3">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-2">
                  <Skeleton className="size-5 rounded" />
                  <Skeleton className="h-7 w-64" />
               </div>
               <Skeleton className="h-8 w-28" />
            </div>
            <Skeleton className="h-4 w-96" />
         </div>
         <div className="flex items-center gap-2 border-t border-b py-2 mb-4">
            <Skeleton className="h-7 w-44" />
            <Skeleton className="h-7 w-16" />
         </div>
         <div className="grid grid-cols-12 gap-4">
            <Skeleton className="h-[300px] col-span-12 md:col-span-6" />
            <Skeleton className="h-[300px] col-span-12 md:col-span-6" />
            <Skeleton className="h-[300px] col-span-12 md:col-span-6" />
            <Skeleton className="h-[300px] col-span-12 md:col-span-6" />
         </div>
      </main>
   );
}

// =============================================================================
// Main Content
// =============================================================================

function HomePageContent() {
   const { data: dashboard, error } = useQuery(
      orpc.analytics.getDefaultDashboard.queryOptions(),
   );

   if (error) {
      return (
         <main className="flex flex-col items-center justify-center min-h-[400px] gap-4">
            <div className="text-center">
               <h2 className="text-lg font-semibold">
                  Dashboard não encontrado
               </h2>
               <p className="text-sm text-muted-foreground mt-2">
                  Complete o processo de onboarding para criar seu dashboard.
               </p>
            </div>
         </main>
      );
   }

   if (!dashboard) {
      return <HomePageSkeleton />;
   }

   return (
      <DashboardView dashboard={dashboard}>
         <QuickStartChecklist />
      </DashboardView>
   );
}

// =============================================================================
// Page Component
// =============================================================================

function HomePage() {
   return (
      <ErrorBoundary FallbackComponent={HomePageErrorFallback}>
         <Suspense fallback={<HomePageSkeleton />}>
            <HomePageContent />
         </Suspense>
      </ErrorBoundary>
   );
}
