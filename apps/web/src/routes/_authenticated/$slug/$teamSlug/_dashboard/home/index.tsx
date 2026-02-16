import { Button } from "@packages/ui/components/button";
import { createErrorFallback } from "@packages/ui/components/error-fallback";
import {
   Popover,
   PopoverContent,
   PopoverTrigger,
} from "@packages/ui/components/popover";
import { Skeleton } from "@packages/ui/components/skeleton";
import { cn } from "@packages/ui/lib/utils";
import { formatRelativeTime } from "@packages/utils/date";
import {
   useMutation,
   useQuery,
   useQueryClient,
   useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
   Calendar,
   Clock,
   Filter,
   LayoutDashboard,
   Pencil,
   Plus,
   RefreshCw,
   X,
} from "lucide-react";
import { Suspense, useMemo, useState } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { DashboardFilterSheet } from "@/features/analytics/ui/dashboard-filter-sheet";
import { EditableDashboardGrid } from "@/features/analytics/ui/editable-dashboard-grid";
import { QuickStartChecklist } from "@/features/onboarding/ui/quick-start-checklist";
import { orpc } from "@/integrations/orpc/client";
import type {
   Dashboard,
   DashboardDateRange,
   DashboardFilter,
} from "@packages/database/schemas/dashboards";
import { Badge } from "@packages/ui/components/badge";

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
   dashboard,
   isEditing,
   onEditToggle,
   onAddInsight,
}: {
   dashboard: Dashboard;
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
         <DashboardFilterBar dashboard={dashboard} />
      </div>
   );
}

// Date range presets
const DATE_RANGE_PRESETS = [
   { label: "Últimos 7 dias", value: "7d" },
   { label: "Últimos 30 dias", value: "30d" },
   { label: "Últimos 90 dias", value: "90d" },
   { label: "Este mês", value: "this_month" },
   { label: "Mês passado", value: "last_month" },
] as const;

function DashboardFilterBar({ dashboard }: { dashboard: Dashboard }) {
   const queryClient = useQueryClient();
   const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
   const [isDateRangeOpen, setIsDateRangeOpen] = useState(false);

   // Get insights for last refreshed time
   const { data: insights } = useQuery(
      orpc.analytics.getDashboardInsights.queryOptions({
         input: { dashboardId: dashboard.id },
      }),
   );

   // Calculate last refreshed time (oldest lastComputedAt)
   const lastRefreshedTime = useMemo(() => {
      if (!insights || insights.length === 0) {
         return null;
      }

      const oldestComputedAt = insights.reduce((oldest, insight) => {
         if (!insight.lastComputedAt) return oldest;
         if (!oldest) return insight.lastComputedAt;
         return insight.lastComputedAt < oldest
            ? insight.lastComputedAt
            : oldest;
      }, null as Date | null);

      return oldestComputedAt ? formatRelativeTime(oldestComputedAt) : null;
   }, [insights]);

   // Refresh dashboard mutation
   const refreshMutation = useMutation(
      orpc.insights.refreshDashboard.mutationOptions({
         onSuccess: () => {
            queryClient.invalidateQueries({
               queryKey: orpc.analytics.getDashboardInsights.queryKey({
                  input: { dashboardId: dashboard.id },
               }),
            });
            queryClient.invalidateQueries({
               queryKey: orpc.analytics.getDefaultDashboard.queryKey(),
            });
         },
      }),
   );

   // Update global filters mutation
   const updateFiltersMutation = useMutation(
      orpc.dashboards.updateGlobalFilters.mutationOptions({
         onSuccess: () => {
            queryClient.invalidateQueries({
               queryKey: orpc.analytics.getDefaultDashboard.queryKey(),
            });
            setIsFilterSheetOpen(false);
         },
      }),
   );

   // Handle date range change
   const handleDateRangeChange = (preset: string) => {
      const dateRange: DashboardDateRange = {
         type: "relative",
         value: preset,
      };

      updateFiltersMutation.mutate({
         dashboardId: dashboard.id,
         globalDateRange: dateRange,
      });

      setIsDateRangeOpen(false);
   };

   // Handle date range removal
   const handleRemoveDateRange = () => {
      updateFiltersMutation.mutate({
         dashboardId: dashboard.id,
         globalDateRange: null,
      });

      setIsDateRangeOpen(false);
   };

   // Handle filter save
   const handleFiltersSave = (filters: DashboardFilter[]) => {
      updateFiltersMutation.mutate({
         dashboardId: dashboard.id,
         globalFilters: filters,
      });
   };

   // Get current date range label
   const dateRangeLabel = useMemo(() => {
      if (!dashboard.globalDateRange) {
         return "Sem período global";
      }

      const preset = DATE_RANGE_PRESETS.find(
         (p) => p.value === dashboard.globalDateRange?.value,
      );

      return preset?.label ?? dashboard.globalDateRange.value;
   }, [dashboard.globalDateRange]);

   // Get filter count
   const filterCount = dashboard.globalFilters?.length ?? 0;

   return (
      <>
         <div className="flex items-center justify-between gap-3 border-t border-b py-2">
            <div className="flex items-center gap-1.5">
               {/* Date range popover */}
               <Popover open={isDateRangeOpen} onOpenChange={setIsDateRangeOpen}>
                  <PopoverTrigger asChild>
                     <Button
                        className={cn(
                           "h-7 text-xs gap-1.5",
                           dashboard.globalDateRange
                              ? "text-foreground"
                              : "text-muted-foreground",
                        )}
                        size="sm"
                        variant="outline"
                     >
                        <Calendar className="size-3.5" />
                        {dateRangeLabel}
                     </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-64 p-2">
                     <div className="flex flex-col gap-1">
                        {DATE_RANGE_PRESETS.map((preset) => (
                           <Button
                              className="justify-start"
                              key={preset.value}
                              onClick={() => handleDateRangeChange(preset.value)}
                              size="sm"
                              variant={
                                 dashboard.globalDateRange?.value === preset.value
                                    ? "secondary"
                                    : "ghost"
                              }
                           >
                              {preset.label}
                           </Button>
                        ))}

                        {dashboard.globalDateRange && (
                           <>
                              <div className="my-1 border-t" />
                              <Button
                                 className="justify-start text-destructive hover:text-destructive"
                                 onClick={handleRemoveDateRange}
                                 size="sm"
                                 variant="ghost"
                              >
                                 <X className="size-3.5" />
                                 Remover período global
                              </Button>
                           </>
                        )}
                     </div>
                  </PopoverContent>
               </Popover>

               {/* Filter button */}
               <Button
                  className={cn(
                     "h-7 text-xs gap-1",
                     filterCount > 0 ? "text-foreground" : "text-muted-foreground",
                  )}
                  onClick={() => setIsFilterSheetOpen(true)}
                  size="sm"
                  variant="outline"
               >
                  <Filter className="size-3" />
                  Filtros
                  {filterCount > 0 && (
                     <Badge className="ml-1 h-4 px-1 text-xs" variant="secondary">
                        {filterCount}
                     </Badge>
                  )}
               </Button>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
               {lastRefreshedTime && (
                  <span className="hidden sm:inline-flex items-center gap-1">
                     <Clock className="size-3" />
                     Atualizado {lastRefreshedTime}
                  </span>
               )}
               <Button
                  className="h-7 text-xs gap-1.5"
                  disabled={refreshMutation.isPending}
                  onClick={() =>
                     refreshMutation.mutate({ dashboardId: dashboard.id })
                  }
                  size="sm"
                  variant="outline"
               >
                  <RefreshCw
                     className={cn(
                        "size-3",
                        refreshMutation.isPending && "animate-spin",
                     )}
                  />
                  {refreshMutation.isPending ? "Atualizando..." : "Atualizar"}
               </Button>
            </div>
         </div>

         {/* Filter sheet */}
         <DashboardFilterSheet
            dashboard={dashboard}
            isOpen={isFilterSheetOpen}
            isPending={updateFiltersMutation.isPending}
            onClose={() => setIsFilterSheetOpen(false)}
            onSave={handleFiltersSave}
         />
      </>
   );
}

// =============================================================================
// Main Content
// =============================================================================

function HomePageContent() {
   const { data: dashboard, error } = useQuery(
      orpc.analytics.getDefaultDashboard.queryOptions(),
   );
   const [isEditing, setIsEditing] = useState(false);
   const [openAddSheet, setOpenAddSheet] = useState<(() => void) | null>(null);

   // Show empty state if dashboard doesn't exist
   if (error) {
      return (
         <main className="flex flex-col items-center justify-center min-h-[400px] gap-4">
            <div className="text-center">
               <h2 className="text-lg font-semibold">Dashboard não encontrado</h2>
               <p className="text-sm text-muted-foreground mt-2">
                  Complete o processo de onboarding para criar seu dashboard.
               </p>
            </div>
         </main>
      );
   }

   // Show loading state while fetching
   if (!dashboard) {
      return <HomePageSkeleton />;
   }

   return (
      <main className="flex flex-col gap-0">
         <DashboardHeader
            dashboard={dashboard}
            isEditing={isEditing}
            onAddInsight={() => {
               if (openAddSheet) {
                  openAddSheet();
               }
            }}
            onEditToggle={() => setIsEditing(true)}
         />
         <div className="flex flex-col gap-4 pt-4">
            <QuickStartChecklist />
            <EditableDashboardGrid
               dashboard={dashboard}
               isEditing={isEditing}
               onDoneEditing={() => setIsEditing(false)}
               onOpenAddSheet={setOpenAddSheet}
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
