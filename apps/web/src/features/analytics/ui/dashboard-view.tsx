import type { Condition } from "@f-o-t/condition-evaluator";
import type {
   Dashboard,
   DashboardDateRange,
} from "@packages/database/schemas/dashboards";
import { Button } from "@packages/ui/components/button";
import {
   Popover,
   PopoverContent,
   PopoverTrigger,
} from "@packages/ui/components/popover";
import { cn } from "@packages/ui/lib/utils";
import { formatRelativeTime } from "@packages/utils/date";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
   ArrowLeft,
   Calendar,
   Clock,
   LayoutDashboard,
   Plus,
   RefreshCw,
   X,
} from "lucide-react";
import { type ReactNode, useCallback, useMemo, useRef, useState } from "react";
import { DashboardFilterPopover } from "@/features/analytics/ui/dashboard-filter-popover";
import { EditableDashboardGrid } from "@/features/analytics/ui/editable-dashboard-grid";
import { InlineEditableText } from "@/features/analytics/ui/inline-editable-text";
import { orpc } from "@/integrations/orpc/client";
import { DateRangePicker } from "@packages/ui/components/date-range-picker";

// =============================================================================
// Types
// =============================================================================

interface DashboardViewProps {
   dashboard: Dashboard;
   backTo?: { slug: string; teamSlug: string };
   children?: ReactNode;
}

// =============================================================================
// Header (PostHog-style inline editing)
// =============================================================================

function DashboardHeader({
   dashboard,
   backTo,
   onAddInsight,
}: {
   dashboard: Dashboard;
   backTo?: { slug: string; teamSlug: string };
   onAddInsight: () => void;
}) {
   const queryClient = useQueryClient();

   const updateMutation = useMutation(
      orpc.dashboards.update.mutationOptions({
         onSuccess: () => {
            queryClient.invalidateQueries({
               queryKey: orpc.analytics.getDefaultDashboard.queryKey(),
            });
            queryClient.invalidateQueries({
               queryKey: orpc.dashboards.getById.queryKey({
                  input: { id: dashboard.id },
               }),
            });
            queryClient.invalidateQueries({
               queryKey: orpc.dashboards.list.queryKey({}),
            });
         },
      }),
   );

   const handleNameSave = useCallback(
      (name: string) => {
         if (name) {
            updateMutation.mutate({ id: dashboard.id, name });
         }
      },
      [updateMutation, dashboard.id],
   );

   const handleDescriptionSave = useCallback(
      (description: string) => {
         updateMutation.mutate({
            id: dashboard.id,
            description: description || undefined,
         });
      },
      [updateMutation, dashboard.id],
   );

   return (
      <div className="flex flex-col gap-0">
         {/* Title row */}
         <div className="flex items-center justify-between gap-4 pb-1">
            <div className="flex items-center gap-2 min-w-0">
               {backTo && (
                  <Link
                     params={backTo as never}
                     to={"/$slug/$teamSlug/analytics/dashboards" as never}
                  >
                     <Button className="size-7" size="icon" variant="ghost">
                        <ArrowLeft className="size-4" />
                     </Button>
                  </Link>
               )}
               <LayoutDashboard className="size-5 text-muted-foreground shrink-0" />
               <InlineEditableText
                  className="text-lg font-semibold tracking-tight"
                  onSave={handleNameSave}
                  placeholder="Nome do dashboard"
                  value={dashboard.name}
               />
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
               <Button onClick={onAddInsight} size="sm">
                  <Plus className="size-3.5" />
                  Adicionar insight
               </Button>
            </div>
         </div>

         {/* Description — always visible, inline editable */}
         <div className={cn("pb-3", backTo && "pl-10")}>
            <InlineEditableText
               className="text-sm text-muted-foreground"
               onSave={handleDescriptionSave}
               placeholder="Adicionar descrição (opcional)"
               value={dashboard.description ?? ""}
            />
         </div>
      </div>
   );
}

// =============================================================================
// Filter Bar
// =============================================================================

const DATE_RANGE_PRESETS = [
   { label: "Últimos 7 dias", value: "7d" },
   { label: "Últimos 30 dias", value: "30d" },
   { label: "Últimos 90 dias", value: "90d" },
   { label: "Este mês", value: "this_month" },
   { label: "Mês passado", value: "last_month" },
   { label: "Este ano", value: "this_year" },
] as const;

function DashboardFilterBar({ dashboard }: { dashboard: Dashboard }) {
   const queryClient = useQueryClient();
   const [isDateRangeOpen, setIsDateRangeOpen] = useState(false);

   const { data: insights } = useQuery(
      orpc.analytics.getDashboardInsights.queryOptions({
         input: { dashboardId: dashboard.id },
      }),
   );

   const lastRefreshedTime = useMemo(() => {
      if (!insights || insights.length === 0) return null;

      const oldestComputedAt = insights.reduce(
         (oldest, insight) => {
            if (!insight.lastComputedAt) return oldest;
            if (!oldest) return insight.lastComputedAt;
            return insight.lastComputedAt < oldest
               ? insight.lastComputedAt
               : oldest;
         },
         null as Date | null,
      );

      return oldestComputedAt ? formatRelativeTime(oldestComputedAt) : null;
   }, [insights]);

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
            queryClient.invalidateQueries({
               queryKey: orpc.dashboards.getById.queryKey({
                  input: { id: dashboard.id },
               }),
            });
         },
      }),
   );

   const updateFiltersMutation = useMutation(
      orpc.dashboards.updateGlobalFilters.mutationOptions({
         onSuccess: () => {
            queryClient.invalidateQueries({
               queryKey: orpc.analytics.getDefaultDashboard.queryKey(),
            });
            queryClient.invalidateQueries({
               queryKey: orpc.dashboards.getById.queryKey({
                  input: { id: dashboard.id },
               }),
            });
         },
      }),
   );

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

   const handleRemoveDateRange = () => {
      updateFiltersMutation.mutate({
         dashboardId: dashboard.id,
         globalDateRange: null,
      });
      setIsDateRangeOpen(false);
   };

   const handleAbsoluteRangeChange = (range: { from: Date; to: Date }) => {
      const fmt = (d: Date) => d.toISOString().split("T")[0];
      const dateRange: DashboardDateRange = {
         type: "absolute",
         value: `${fmt(range.from)},${fmt(range.to)}`,
      };
      updateFiltersMutation.mutate({
         dashboardId: dashboard.id,
         globalDateRange: dateRange,
      });
      setIsDateRangeOpen(false);
   };

   const handleFiltersSave = (filters: Condition[]) => {
      updateFiltersMutation.mutate({
         dashboardId: dashboard.id,
         globalFilters: filters,
      });
   };

   const dateRangeLabel = useMemo(() => {
      if (!dashboard.globalDateRange) return "Sem período global";
      if (dashboard.globalDateRange.type === "absolute") {
         const parts = dashboard.globalDateRange.value.split(",");
         if (parts.length === 2) {
            const fmt = (s: string) =>
               new Date(`${s.trim()}T00:00:00Z`).toLocaleDateString("pt-BR", {
                  day: "numeric",
                  month: "short",
               });
            return `${fmt(parts[0])} – ${fmt(parts[1])}`;
         }
      }
      const preset = DATE_RANGE_PRESETS.find(
         (p) => p.value === dashboard.globalDateRange?.value,
      );
      return preset?.label ?? dashboard.globalDateRange.value;
   }, [dashboard.globalDateRange]);

   const absoluteDateRange = useMemo(() => {
      if (dashboard.globalDateRange?.type !== "absolute") return null;
      const parts = dashboard.globalDateRange.value.split(",");
      if (parts.length !== 2) return null;
      return {
         from: new Date(`${parts[0].trim()}T00:00:00Z`),
         to: new Date(`${parts[1].trim()}T23:59:59Z`),
      };
   }, [dashboard.globalDateRange]);

   return (
      <div className="flex items-center justify-between gap-3 border-t border-b py-2">
         <div className="flex items-center gap-1.5">
            <Popover onOpenChange={setIsDateRangeOpen} open={isDateRangeOpen}>
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
               <PopoverContent align="start" className="w-auto p-0">
                  <DateRangePicker
                     heading="Período"
                     onPresetSelect={handleDateRangeChange}
                     onRangeSelect={handleAbsoluteRangeChange}
                     presets={DATE_RANGE_PRESETS}
                     selectedPreset={
                        dashboard.globalDateRange?.type === "relative"
                           ? dashboard.globalDateRange.value
                           : null
                     }
                     selectedRange={absoluteDateRange}
                  />
                  {dashboard.globalDateRange && (
                     <div className="border-t p-2">
                        <Button
                           className="w-full justify-start text-destructive hover:text-destructive"
                           onClick={handleRemoveDateRange}
                           size="sm"
                           variant="ghost"
                        >
                           <X className="size-3.5" />
                           Remover período global
                        </Button>
                     </div>
                  )}
               </PopoverContent>
            </Popover>

            <DashboardFilterPopover
               dashboard={dashboard}
               isPending={updateFiltersMutation.isPending}
               onSave={handleFiltersSave}
            />
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
   );
}

// =============================================================================
// Main Component
// =============================================================================

export function DashboardView({
   dashboard,
   backTo,
   children,
}: DashboardViewProps) {
   const addInsightRef = useRef<(() => void) | null>(null);

   return (
      <main className="flex flex-col gap-0">
         <DashboardHeader
            backTo={backTo}
            dashboard={dashboard}
            onAddInsight={() => addInsightRef.current?.()}
         />
         <DashboardFilterBar dashboard={dashboard} />
         <div className="flex flex-col gap-4 pt-4">
            {children}
            <EditableDashboardGrid
               dashboard={dashboard}
               onOpenAddInsight={(fn) => {
                  addInsightRef.current = fn;
               }}
            />
         </div>
      </main>
   );
}
