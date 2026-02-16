import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { InsightConfig } from "@packages/analytics/types";
import { Button } from "@packages/ui/components/button";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuPortal,
   DropdownMenuSeparator,
   DropdownMenuSub,
   DropdownMenuSubContent,
   DropdownMenuSubTrigger,
   DropdownMenuTrigger,
} from "@packages/ui/components/dropdown-menu";
import { Skeleton } from "@packages/ui/components/skeleton";
import { cn } from "@packages/ui/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "@tanstack/react-router";
import {
   AlertCircle,
   Copy,
   Ellipsis,
   GripVertical,
   Maximize2,
   Pencil,
   RefreshCw,
   Trash2,
} from "lucide-react";
import { orpc } from "@/integrations/orpc/client";
import { InsightPreview } from "./insight-preview";

export type TileSize = "sm" | "md" | "lg" | "full";

interface DashboardTileProps {
   id: string;
   insightName?: string;
   size: TileSize;
   children?: React.ReactNode;
   insightId?: string;
   isEditing?: boolean;
   onRemove?: () => void;
   onResize?: (size: TileSize) => void;
   onDuplicate?: () => void;
}

const sizeLabels: Record<TileSize, string> = {
   sm: "Pequeno (25%)",
   md: "Médio (50%)",
   lg: "Grande (75%)",
   full: "Largura total (100%)",
};

const sizeClasses = {
   sm: "col-span-12 md:col-span-3",
   md: "col-span-12 md:col-span-6",
   lg: "col-span-12 md:col-span-9",
   full: "col-span-12",
};

function TileLoadingSkeleton() {
   return (
      <div className="space-y-3 p-1">
         <Skeleton className="h-3 w-24" />
         <Skeleton className="h-5 w-2/3" />
         <Skeleton className="h-3 w-1/2" />
         <Skeleton className="h-[200px] w-full" />
      </div>
   );
}

function TileErrorState({ error }: { error: Error }) {
   return (
      <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground">
         <AlertCircle className="size-5 text-destructive/60" />
         <p className="text-xs text-center">{error.message}</p>
      </div>
   );
}

function DashboardInsightContent({ insightId }: { insightId: string }) {
   const {
      data: insight,
      isLoading,
      error,
   } = useQuery(
      orpc.insights.getById.queryOptions({
         input: { id: insightId },
      }),
   );

   if (isLoading) return <TileLoadingSkeleton />;
   if (error) return <TileErrorState error={error} />;
   if (!insight) return null;

   return <InsightPreview config={insight.config as InsightConfig} />;
}

/**
 * Resolve insight metadata for the tile header.
 */
function useInsightMetadata(insightName?: string, insightId?: string) {
   const { data: insight } = useQuery({
      ...orpc.insights.getById.queryOptions({
         input: { id: insightId ?? "" },
      }),
      enabled: !!insightId && !insightName,
   });

   const name = insightName || insight?.name || "";
   const description = insight?.description || "";
   const type = insight?.type || "trends";
   const lastComputedAt = insight?.lastComputedAt ?? null;

   // PostHog-style type label with date range
   const typeLabel =
      type === "trends"
         ? "TENDÊNCIAS"
         : type === "funnels"
           ? "FUNIS"
           : type === "retention"
             ? "RETENÇÃO"
             : "INSIGHT";

   // Extract date range from config if available
   const config = insight?.config as Record<string, unknown> | undefined;
   const dateRange = config?.dateRange as
      | { type: string; value: string }
      | undefined;
   const dateRangeLabel = dateRange?.value
      ? formatDateRange(dateRange.value)
      : "ÚLTIMOS 30 DIAS";

   return { name, description, typeLabel, dateRangeLabel, lastComputedAt };
}

function formatDateRange(value: string): string {
   switch (value) {
      case "7d":
         return "ÚLTIMOS 7 DIAS";
      case "14d":
         return "ÚLTIMOS 14 DIAS";
      case "30d":
         return "ÚLTIMOS 30 DIAS";
      case "90d":
         return "ÚLTIMOS 90 DIAS";
      case "this_month":
         return "ESTE MÊS";
      case "last_month":
         return "MÊS PASSADO";
      case "this_year":
         return "ESTE ANO";
      default:
         return value.toUpperCase();
   }
}

function formatLastComputed(date: Date): string {
   const now = new Date();
   const diffMs = now.getTime() - date.getTime();
   const diffMinutes = Math.floor(diffMs / 60000);

   if (diffMinutes < 1) return "Atualizado agora";
   if (diffMinutes < 60) return `Atualizado há ${diffMinutes}min`;

   const diffHours = Math.floor(diffMinutes / 60);
   if (diffHours < 24) return `Atualizado há ${diffHours}h`;

   const diffDays = Math.floor(diffHours / 24);
   return `Atualizado há ${diffDays}d`;
}

export function DashboardTile({
   id,
   insightName,
   size,
   children,
   insightId,
   isEditing = true,
   onRemove,
   onResize,
   onDuplicate,
}: DashboardTileProps) {
   const queryClient = useQueryClient();
   const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
   } = useSortable({ id, disabled: !isEditing });
   const style = {
      transform: CSS.Transform.toString(transform),
      transition,
   };

   const { slug, teamSlug } = useParams({
      from: "/_authenticated/$slug/$teamSlug/_dashboard",
   });
   const { name, description, typeLabel, dateRangeLabel, lastComputedAt } =
      useInsightMetadata(insightName, insightId);

   const handleRefresh = () => {
      if (!insightId) return;
      queryClient.invalidateQueries({
         queryKey: orpc.insights.getById.queryKey({
            input: { id: insightId },
         }),
      });
   };

   return (
      <div
         className={cn(sizeClasses[size], isDragging && "opacity-50 z-10")}
         ref={setNodeRef}
         style={style}
      >
         <div className="h-full rounded-lg border bg-card text-card-foreground">
            {/* Card header — PostHog style */}
            <div className="px-4 pt-4 pb-2">
               <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 min-w-0 flex-1">
                     {isEditing && (
                        <button
                           className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground shrink-0 mt-0.5"
                           type="button"
                           {...attributes}
                           {...listeners}
                        >
                           <GripVertical className="size-4" />
                        </button>
                     )}
                     <div className="min-w-0 flex-1 space-y-1">
                        {/* Type + Date range badge */}
                        <p className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
                           {typeLabel} &bull; {dateRangeLabel}
                        </p>
                        {/* Title */}
                        <h3 className="text-sm font-semibold leading-snug">
                           {name}
                        </h3>
                        {/* Description */}
                        {description && (
                           <p className="text-xs text-muted-foreground leading-relaxed">
                              {description}
                           </p>
                        )}
                     </div>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                           <Button
                              className="size-6"
                              size="icon"
                              variant="ghost"
                           >
                              <Ellipsis className="size-3.5" />
                           </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                           {/* Edit insight */}
                           {insightId && (
                              <DropdownMenuItem asChild>
                                 <Link
                                    params={{
                                       insightId,
                                       slug,
                                       teamSlug,
                                    }}
                                    to="/$slug/$teamSlug/analytics/insights/$insightId"
                                 >
                                    <Pencil className="mr-2 size-4" />
                                    Editar
                                 </Link>
                              </DropdownMenuItem>
                           )}

                           {/* Duplicate on dashboard */}
                           {onDuplicate && (
                              <DropdownMenuItem onClick={onDuplicate}>
                                 <Copy className="mr-2 size-4" />
                                 Duplicar
                              </DropdownMenuItem>
                           )}

                           {/* Resize submenu */}
                           {onResize && (
                              <DropdownMenuSub>
                                 <DropdownMenuSubTrigger>
                                    <Maximize2 className="mr-2 size-4" />
                                    Redimensionar
                                 </DropdownMenuSubTrigger>
                                 <DropdownMenuPortal>
                                    <DropdownMenuSubContent>
                                       {(
                                          Object.entries(sizeLabels) as [
                                             TileSize,
                                             string,
                                          ][]
                                       ).map(([key, label]) => (
                                          <DropdownMenuItem
                                             disabled={key === size}
                                             key={key}
                                             onClick={() => onResize(key)}
                                          >
                                             {label}
                                             {key === size && " \u2713"}
                                          </DropdownMenuItem>
                                       ))}
                                    </DropdownMenuSubContent>
                                 </DropdownMenuPortal>
                              </DropdownMenuSub>
                           )}

                           <DropdownMenuSeparator />

                           {/* Refresh data */}
                           {insightId && (
                              <DropdownMenuItem onClick={handleRefresh}>
                                 <RefreshCw className="mr-2 size-4" />
                                 <div className="flex flex-col">
                                    <span>Atualizar dados</span>
                                    {lastComputedAt && (
                                       <span className="text-[11px] text-muted-foreground">
                                          {formatLastComputed(
                                             new Date(lastComputedAt),
                                          )}
                                       </span>
                                    )}
                                 </div>
                              </DropdownMenuItem>
                           )}

                           {/* Remove from dashboard */}
                           {onRemove && (
                              <>
                                 <DropdownMenuSeparator />
                                 <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={onRemove}
                                 >
                                    <Trash2 className="mr-2 size-4" />
                                    Remover do dashboard
                                 </DropdownMenuItem>
                              </>
                           )}
                        </DropdownMenuContent>
                     </DropdownMenu>
                  </div>
               </div>
            </div>

            {/* Chart / content area */}
            <div className="px-4 pb-4">
               {insightId ? (
                  <DashboardInsightContent insightId={insightId} />
               ) : (
                  children
               )}
            </div>
         </div>
      </div>
   );
}
