import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { InsightConfig } from "@packages/analytics/types";
import { Button } from "@packages/ui/components/button";
import { Skeleton } from "@packages/ui/components/skeleton";
import { cn } from "@packages/ui/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Ellipsis, GripVertical, X } from "lucide-react";
import { orpc } from "@/integrations/orpc/client";
import { InsightPreview } from "./insight-preview";

interface DashboardTileProps {
   id: string;
   insightName?: string;
   size: "sm" | "md" | "lg" | "full";
   children?: React.ReactNode;
   insightId?: string;
   isEditing?: boolean;
   onRemove?: () => void;
}

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

   // PostHog-style type label with date range
   const typeLabel =
      type === "trends"
         ? "TRENDS"
         : type === "funnels"
           ? "FUNNELS"
           : type === "retention"
             ? "RETENTION"
             : "INSIGHT";

   // Extract date range from config if available
   const config = insight?.config as Record<string, unknown> | undefined;
   const dateRange = config?.dateRange as
      | { type: string; value: string }
      | undefined;
   const dateRangeLabel = dateRange?.value
      ? formatDateRange(dateRange.value)
      : "LAST 30 DAYS";

   return { name, description, typeLabel, dateRangeLabel };
}

function formatDateRange(value: string): string {
   switch (value) {
      case "7d":
         return "LAST 7 DAYS";
      case "14d":
         return "LAST 14 DAYS";
      case "30d":
         return "LAST 30 DAYS";
      case "90d":
         return "LAST 90 DAYS";
      case "this_month":
         return "THIS MONTH";
      case "last_month":
         return "LAST MONTH";
      case "this_year":
         return "THIS YEAR";
      default:
         return value.toUpperCase();
   }
}

export function DashboardTile({
   id,
   insightName,
   size,
   children,
   insightId,
   isEditing = true,
   onRemove,
}: DashboardTileProps) {
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

   const { name, description, typeLabel, dateRangeLabel } = useInsightMetadata(
      insightName,
      insightId,
   );

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
                     {onRemove && (
                        <Button
                           className="size-6"
                           onClick={onRemove}
                           size="icon"
                           variant="ghost"
                        >
                           <X className="size-3" />
                        </Button>
                     )}
                     {!isEditing && (
                        <Button className="size-6" size="icon" variant="ghost">
                           <Ellipsis className="size-3.5" />
                        </Button>
                     )}
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
