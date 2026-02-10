import type {
   Dashboard,
   DashboardTile as DashboardTileType,
} from "@packages/database/schemas/dashboards";
import type { Insight } from "@packages/database/schemas/insights";
import { Button } from "@packages/ui/components/button";
import {
   Card,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { Skeleton } from "@packages/ui/components/skeleton";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
   BarChart3,
   Check,
   Loader2,
   Maximize2,
   Minimize2,
   Plus,
   RotateCcw,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useSheet } from "@/hooks/use-sheet";
import { orpc } from "@/integrations/orpc/client";
import { DashboardGrid } from "./dashboard-grid";
import { DashboardTile } from "./dashboard-tile";

// =============================================================================
// Types
// =============================================================================

interface EditableDashboardGridProps {
   dashboard: Dashboard;
   isEditing: boolean;
   onDoneEditing: () => void;
}

// =============================================================================
// Size cycling helpers
// =============================================================================

const sizeOrder: DashboardTileType["size"][] = ["sm", "md", "lg", "full"];

function nextSize(
   current: DashboardTileType["size"],
): DashboardTileType["size"] {
   const idx = sizeOrder.indexOf(current);
   return sizeOrder[(idx + 1) % sizeOrder.length];
}

function prevSize(
   current: DashboardTileType["size"],
): DashboardTileType["size"] {
   const idx = sizeOrder.indexOf(current);
   return sizeOrder[(idx - 1 + sizeOrder.length) % sizeOrder.length];
}

// =============================================================================
// Add Tile Sheet
// =============================================================================

function AddTileSheet({
   existingInsightIds,
   onAdd,
}: {
   existingInsightIds: Set<string>;
   onAdd: (insight: Insight) => void;
}) {
   const { data: insights, isLoading } = useQuery(
      orpc.insights.list.queryOptions({}),
   );

   const availableInsights = useMemo(
      () => (insights ?? []).filter((i) => !existingInsightIds.has(i.id)),
      [insights, existingInsightIds],
   );

   if (isLoading) {
      return (
         <div className="flex flex-col gap-3 p-4">
            <h3 className="text-lg font-semibold">Adicionar tile</h3>
            {Array.from({ length: 4 }).map((_, i) => (
               <Skeleton className="h-16 w-full" key={`skeleton-${i + 1}`} />
            ))}
         </div>
      );
   }

   if (availableInsights.length === 0) {
      return (
         <div className="flex flex-col items-center justify-center gap-3 p-8 text-muted-foreground">
            <BarChart3 className="size-8" />
            <p className="text-sm text-center">
               {(insights ?? []).length === 0
                  ? "Nenhum insight criado ainda. Crie insights na seção de Analytics."
                  : "Todos os insights já estão no dashboard."}
            </p>
         </div>
      );
   }

   return (
      <div className="flex flex-col gap-3 p-4">
         <h3 className="text-lg font-semibold">Adicionar tile</h3>
         <p className="text-sm text-muted-foreground">
            Selecione um insight para adicionar ao dashboard.
         </p>
         <div className="flex flex-col gap-2 mt-2">
            {availableInsights.map((insight) => (
               <button
                  className="text-left rounded-lg border p-3 hover:bg-accent transition-colors"
                  key={insight.id}
                  onClick={() => onAdd(insight)}
                  type="button"
               >
                  <div className="flex items-center gap-3">
                     <div className="size-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                        <BarChart3 className="size-4 text-primary" />
                     </div>
                     <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                           {insight.name}
                        </p>
                        {insight.description && (
                           <p className="text-xs text-muted-foreground truncate">
                              {insight.description}
                           </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                           {insight.type}
                        </p>
                     </div>
                  </div>
               </button>
            ))}
         </div>
      </div>
   );
}

// =============================================================================
// Edit Mode Toolbar
// =============================================================================

function EditToolbar({
   onSave,
   onCancel,
   onAddTile,
   isSaving,
   hasChanges,
}: {
   onSave: () => void;
   onCancel: () => void;
   onAddTile: () => void;
   isSaving: boolean;
   hasChanges: boolean;
}) {
   return (
      <div className="flex items-center gap-2 flex-wrap">
         <Button onClick={onAddTile} size="sm" variant="outline">
            <Plus className="size-4" />
            Adicionar tile
         </Button>
         <div className="flex-1" />
         <Button onClick={onCancel} size="sm" variant="ghost">
            <RotateCcw className="size-4" />
            Cancelar
         </Button>
         <Button disabled={!hasChanges || isSaving} onClick={onSave} size="sm">
            {isSaving ? (
               <Loader2 className="size-4 animate-spin" />
            ) : (
               <Check className="size-4" />
            )}
            Salvar
         </Button>
      </div>
   );
}

// =============================================================================
// Tile Size Controls (shown in edit mode)
// =============================================================================

function TileSizeControls({
   size,
   onGrow,
   onShrink,
}: {
   size: DashboardTileType["size"];
   onGrow: () => void;
   onShrink: () => void;
}) {
   const isSmallest = size === "sm";
   const isLargest = size === "full";

   return (
      <div className="flex items-center gap-0.5">
         <Button
            className="size-6"
            disabled={isSmallest}
            onClick={onShrink}
            size="icon"
            title="Diminuir"
            variant="ghost"
         >
            <Minimize2 className="size-3" />
         </Button>
         <span className="text-[10px] font-medium text-muted-foreground uppercase w-6 text-center">
            {size}
         </span>
         <Button
            className="size-6"
            disabled={isLargest}
            onClick={onGrow}
            size="icon"
            title="Aumentar"
            variant="ghost"
         >
            <Maximize2 className="size-3" />
         </Button>
      </div>
   );
}

// =============================================================================
// Main Component
// =============================================================================

export function EditableDashboardGrid({
   dashboard,
   isEditing,
   onDoneEditing,
}: EditableDashboardGridProps) {
   const queryClient = useQueryClient();
   const { openSheet, closeSheet } = useSheet();

   // Local tile state for optimistic editing
   const [localTiles, setLocalTiles] = useState<DashboardTileType[]>(
      dashboard.tiles,
   );

   // Reset local state when dashboard changes (e.g., after save) or editing starts
   const dashboardTilesJson = JSON.stringify(dashboard.tiles);
   const [lastDashboardTiles, setLastDashboardTiles] =
      useState(dashboardTilesJson);
   if (dashboardTilesJson !== lastDashboardTiles) {
      setLastDashboardTiles(dashboardTilesJson);
      setLocalTiles(dashboard.tiles);
   }

   const hasChanges = useMemo(
      () => JSON.stringify(localTiles) !== dashboardTilesJson,
      [localTiles, dashboardTilesJson],
   );

   // Save mutation
   const saveMutation = useMutation(
      orpc.dashboards.updateTiles.mutationOptions({
         onSuccess: () => {
            queryClient.invalidateQueries({
               queryKey: orpc.analytics.getDefaultDashboard.queryKey({}),
            });
            onDoneEditing();
         },
      }),
   );

   // Tile operations
   const handleReorder = useCallback((reordered: DashboardTileType[]) => {
      setLocalTiles(reordered);
   }, []);

   const handleRemoveTile = useCallback((insightId: string) => {
      setLocalTiles((prev) =>
         prev
            .filter((t) => t.insightId !== insightId)
            .map((t, i) => ({ ...t, order: i })),
      );
   }, []);

   const handleResizeGrow = useCallback((insightId: string) => {
      setLocalTiles((prev) =>
         prev.map((t) =>
            t.insightId === insightId ? { ...t, size: nextSize(t.size) } : t,
         ),
      );
   }, []);

   const handleResizeShrink = useCallback((insightId: string) => {
      setLocalTiles((prev) =>
         prev.map((t) =>
            t.insightId === insightId ? { ...t, size: prevSize(t.size) } : t,
         ),
      );
   }, []);

   const handleAddTile = useCallback(
      (insight: Insight) => {
         setLocalTiles((prev) => [
            ...prev,
            {
               insightId: insight.id,
               size: (insight.defaultSize as DashboardTileType["size"]) || "md",
               order: prev.length,
            },
         ]);
         closeSheet();
      },
      [closeSheet],
   );

   const handleOpenAddSheet = useCallback(() => {
      const existingIds = new Set(localTiles.map((t) => t.insightId));
      openSheet({
         children: (
            <AddTileSheet
               existingInsightIds={existingIds}
               onAdd={handleAddTile}
            />
         ),
      });
   }, [localTiles, openSheet, handleAddTile]);

   const handleSave = useCallback(() => {
      saveMutation.mutate({ id: dashboard.id, tiles: localTiles });
   }, [saveMutation, dashboard.id, localTiles]);

   const handleCancel = useCallback(() => {
      setLocalTiles(dashboard.tiles);
      onDoneEditing();
   }, [dashboard.tiles, onDoneEditing]);

   const tiles = isEditing ? localTiles : dashboard.tiles;

   if (tiles.length === 0 && !isEditing) {
      return (
         <Card>
            <CardHeader className="items-center text-center py-12">
               <BarChart3 className="size-10 text-muted-foreground mb-2" />
               <CardTitle className="text-base">Dashboard vazio</CardTitle>
               <CardDescription>
                  Clique em "Personalizar" para adicionar tiles ao seu
                  dashboard.
               </CardDescription>
            </CardHeader>
         </Card>
      );
   }

   return (
      <div className="flex flex-col gap-4">
         {isEditing && (
            <EditToolbar
               hasChanges={hasChanges}
               isSaving={saveMutation.isPending}
               onAddTile={handleOpenAddSheet}
               onCancel={handleCancel}
               onSave={handleSave}
            />
         )}

         <DashboardGrid
            onReorder={isEditing ? handleReorder : () => {}}
            renderTile={(tile) => (
               <DashboardTile
                  headerActions={
                     isEditing ? (
                        <TileSizeControls
                           onGrow={() => handleResizeGrow(tile.insightId)}
                           onShrink={() => handleResizeShrink(tile.insightId)}
                           size={tile.size}
                        />
                     ) : undefined
                  }
                  id={tile.insightId}
                  insightId={tile.insightId}
                  isEditing={isEditing}
                  key={tile.insightId}
                  onRemove={
                     isEditing
                        ? () => handleRemoveTile(tile.insightId)
                        : undefined
                  }
                  size={tile.size}
               />
            )}
            tiles={tiles}
         />

         {isEditing && (
            <Button
               className="w-full border-dashed"
               onClick={handleOpenAddSheet}
               variant="outline"
            >
               <Plus className="size-4" />
               Adicionar tile
            </Button>
         )}
      </div>
   );
}
