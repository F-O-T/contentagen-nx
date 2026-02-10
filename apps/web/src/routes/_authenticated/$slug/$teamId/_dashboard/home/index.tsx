import { Button } from "@packages/ui/components/button";
import {
   Card,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { createErrorFallback } from "@packages/ui/components/error-fallback";
import { Skeleton } from "@packages/ui/components/skeleton";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, Pencil } from "lucide-react";
import { Suspense, useState } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { EditableDashboardGrid } from "@/features/analytics/ui/editable-dashboard-grid";
import { QuickStartChecklist } from "@/features/onboarding/ui/quick-start-checklist";
import { orpc } from "@/integrations/orpc/client";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamId/_dashboard/home/",
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
      <main className="flex flex-col gap-4">
         <div className="flex items-center justify-between">
            <div className="flex flex-col gap-2">
               <Skeleton className="h-9 w-48" />
               <Skeleton className="h-5 w-80" />
            </div>
            <Skeleton className="h-9 w-28" />
         </div>

         {/* Grid skeleton */}
         <div className="grid grid-cols-12 gap-4">
            <Skeleton className="h-[260px] col-span-12" />
            <Skeleton className="h-[300px] col-span-12 md:col-span-6" />
            <Skeleton className="h-[300px] col-span-12 md:col-span-6" />
         </div>
      </main>
   );
}

// =============================================================================
// Header
// =============================================================================

function HomePageHeader({
   isEditing,
   onEditToggle,
   hasDashboard,
}: {
   isEditing: boolean;
   onEditToggle: () => void;
   hasDashboard: boolean;
}) {
   return (
      <div className="flex items-center justify-between gap-4">
         <div className="flex flex-col gap-1">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight font-serif leading-tight">
               Dashboard
            </h1>
            <p className="text-base md:text-lg text-muted-foreground font-sans leading-relaxed">
               Seu espaço de trabalho para criação de conteúdo com IA
            </p>
         </div>
         {hasDashboard && !isEditing && (
            <Button onClick={onEditToggle} size="sm" variant="outline">
               <Pencil className="size-4" />
               Personalizar
            </Button>
         )}
      </div>
   );
}

// =============================================================================
// Empty State (no default dashboard)
// =============================================================================

function EmptyDashboardState() {
   return (
      <Card>
         <CardHeader className="items-center text-center py-12">
            <BarChart3 className="size-10 text-muted-foreground mb-2" />
            <CardTitle className="text-base">
               Dashboard ainda não configurado
            </CardTitle>
            <CardDescription>
               Um dashboard padrão será criado automaticamente quando insights
               estiverem disponíveis.
            </CardDescription>
         </CardHeader>
      </Card>
   );
}

// =============================================================================
// Main Content
// =============================================================================

function HomePageContent() {
   const { data: dashboard } = useSuspenseQuery(
      orpc.analytics.getDefaultDashboard.queryOptions(),
   );
   const [isEditing, setIsEditing] = useState(false);

   if (!dashboard) {
      return (
         <main className="flex flex-col gap-4">
            <HomePageHeader
               hasDashboard={false}
               isEditing={false}
               onEditToggle={() => {}}
            />
            <QuickStartChecklist />
            <EmptyDashboardState />
         </main>
      );
   }

   return (
      <main className="flex flex-col gap-4">
         <HomePageHeader
            hasDashboard
            isEditing={isEditing}
            onEditToggle={() => setIsEditing(true)}
         />
         <QuickStartChecklist />
         <EditableDashboardGrid
            dashboard={dashboard}
            isEditing={isEditing}
            onDoneEditing={() => setIsEditing(false)}
         />
      </main>
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
