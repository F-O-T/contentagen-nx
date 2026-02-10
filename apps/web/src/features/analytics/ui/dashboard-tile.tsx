import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { InsightConfig } from "@packages/analytics/types";
import { Button } from "@packages/ui/components/button";
import {
   Card,
   CardContent,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { Skeleton } from "@packages/ui/components/skeleton";
import { cn } from "@packages/ui/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, GripVertical, Pencil, X } from "lucide-react";
import { orpc } from "@/integrations/orpc/client";
import { InsightPreview } from "./insight-preview";

interface DashboardTileProps {
   id: string;
   insightName?: string;
   size: "sm" | "md" | "lg" | "full";
   children?: React.ReactNode;
   insightId?: string;
   isEditing?: boolean;
   headerActions?: React.ReactNode;
   onEdit?: () => void;
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
         <Skeleton className="h-4 w-2/3" />
         <Skeleton className="h-[160px] w-full" />
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
 * Hook to resolve the insight name when insightId is provided.
 * Returns the explicit name if given, or the fetched insight name, or a loading placeholder.
 */
function useInsightName(insightName?: string, insightId?: string): string {
   const { data: insight } = useQuery({
      ...orpc.insights.getById.queryOptions({
         input: { id: insightId ?? "" },
      }),
      enabled: !!insightId && !insightName,
   });

   if (insightName) return insightName;
   if (insight) return insight.name;
   return "";
}

export function DashboardTile({
   id,
   insightName,
   size,
   children,
   insightId,
   isEditing = true,
   headerActions,
   onEdit,
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

   const resolvedName = useInsightName(insightName, insightId);

   return (
      <div
         className={cn(sizeClasses[size], isDragging && "opacity-50 z-10")}
         ref={setNodeRef}
         style={style}
      >
         <Card className="h-full relative">
            <CardHeader className="pb-3">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                     {isEditing && (
                        <button
                           className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
                           type="button"
                           {...attributes}
                           {...listeners}
                        >
                           <GripVertical className="size-4" />
                        </button>
                     )}
                     <CardTitle className="text-sm font-medium">
                        {resolvedName}
                     </CardTitle>
                  </div>
                  <div className="flex items-center gap-1">
                     {headerActions}
                     {onEdit && (
                        <Button
                           className="size-7"
                           onClick={onEdit}
                           size="icon"
                           variant="ghost"
                        >
                           <Pencil className="size-3.5" />
                        </Button>
                     )}
                     {onRemove && (
                        <Button
                           className="size-7"
                           onClick={onRemove}
                           size="icon"
                           variant="ghost"
                        >
                           <X className="size-3.5" />
                        </Button>
                     )}
                  </div>
               </div>
            </CardHeader>
            <CardContent>
               {insightId ? (
                  <DashboardInsightContent insightId={insightId} />
               ) : (
                  children
               )}
            </CardContent>
         </Card>
      </div>
   );
}
