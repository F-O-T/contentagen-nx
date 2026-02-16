import { Button } from "@packages/ui/components/button";
import { createErrorFallback } from "@packages/ui/components/error-fallback";
import { Skeleton } from "@packages/ui/components/skeleton";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
   Calendar,
   Clock,
   LayoutDashboard,
   Pencil,
   Plus,
   RefreshCw,
} from "lucide-react";
import { Suspense, useState } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { EditableDashboardGrid } from "@/features/analytics/ui/editable-dashboard-grid";
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
         {/* Header skeleton */}
         <div className="flex flex-col gap-2 pb-3">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-2">
                  <Skeleton className="size-5 rounded" />
                  <Skeleton className="h-7 w-64" />
               </div>
               <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-8 w-28" />
               </div>
            </div>
            <Skeleton className="h-4 w-96" />
         </div>

         {/* Filter bar skeleton */}
         <div className="flex items-center gap-2 border-t border-b py-2 mb-4">
            <Skeleton className="h-7 w-44" />
            <Skeleton className="h-7 w-16" />
         </div>

         {/* Grid skeleton */}
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
// Header (PostHog-style)
// =============================================================================

function DashboardHeader({
   isEditing,
   onEditToggle,
   onAddInsight,
}: {
   isEditing: boolean;
   onEditToggle: () => void;
   onAddInsight: () => void;
}) {
   return (
      <div className="flex flex-col gap-0">
         {/* Title row */}
         <div className="flex items-center justify-between gap-4 pb-1">
            <div className="flex items-center gap-2 min-w-0">
               <LayoutDashboard className="size-5 text-muted-foreground shrink-0" />
               <h1 className="text-lg font-semibold tracking-tight truncate">
                  Dashboard
               </h1>
            </div>
            {!isEditing && (
               <div className="flex items-center gap-1.5 shrink-0">
                  <Button onClick={onEditToggle} size="sm" variant="outline">
                     <Pencil className="size-3.5" />
                     Personalizar
                  </Button>
                  <Button onClick={onAddInsight} size="sm">
                     <Plus className="size-3.5" />
                     Add insight
                  </Button>
               </div>
            )}
         </div>

         {/* Description */}
         <p className="text-sm text-muted-foreground pb-3">
            Seu espaço de trabalho para criação de conteúdo com IA
         </p>

         {/* Filter bar */}
         <DashboardFilterBar />
      </div>
   );
}

function DashboardFilterBar() {
   return (
      <div className="flex items-center justify-between gap-3 border-t border-b py-2">
         <div className="flex items-center gap-1.5">
            <Button
               className="h-7 text-xs gap-1.5 text-muted-foreground"
               size="sm"
               variant="outline"
            >
               <Calendar className="size-3.5" />
               No date range override
            </Button>
            <Button
               className="h-7 text-xs gap-1 text-muted-foreground"
               size="sm"
               variant="outline"
            >
               <Plus className="size-3" />
               Filter
            </Button>
         </div>
         <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="hidden sm:inline-flex items-center gap-1">
               <Clock className="size-3" />
               Last refreshed just now
            </span>
            <Button className="h-7 text-xs gap-1.5" size="sm" variant="outline">
               <RefreshCw className="size-3" />
               Refresh
            </Button>
         </div>
      </div>
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

   return (
      <main className="flex flex-col gap-0">
         <DashboardHeader
            isEditing={isEditing}
            onAddInsight={() => setIsEditing(true)}
            onEditToggle={() => setIsEditing(true)}
         />
         <div className="flex flex-col gap-4 pt-4">
            <QuickStartChecklist />
            <EditableDashboardGrid
               dashboard={dashboard}
               isEditing={isEditing}
               onDoneEditing={() => setIsEditing(false)}
            />
         </div>
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
