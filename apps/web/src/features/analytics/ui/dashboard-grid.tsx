import { closestCenter, DndContext, type DragEndEvent } from "@dnd-kit/core";
import {
   arrayMove,
   rectSortingStrategy,
   SortableContext,
} from "@dnd-kit/sortable";
import type { DashboardTile as DashboardTileType } from "@packages/database/schemas/dashboards";

interface DashboardGridProps {
   tiles: DashboardTileType[];
   onReorder: (tiles: DashboardTileType[]) => void;
   renderTile: (tile: DashboardTileType) => React.ReactNode;
}

export function DashboardGrid({
   tiles,
   onReorder,
   renderTile,
}: DashboardGridProps) {
   const sortedTiles = [...tiles].sort((a, b) => a.order - b.order);

   const handleDragEnd = (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
         const oldIndex = sortedTiles.findIndex(
            (t) => t.insightId === active.id,
         );
         const newIndex = sortedTiles.findIndex((t) => t.insightId === over.id);
         const reordered = arrayMove(sortedTiles, oldIndex, newIndex).map(
            (tile, index) => ({ ...tile, order: index }),
         );
         onReorder(reordered);
      }
   };

   return (
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
         <SortableContext
            items={sortedTiles.map((t) => t.insightId)}
            strategy={rectSortingStrategy}
         >
            <div className="grid grid-cols-12 gap-4 auto-rows-min">
               {sortedTiles.map((tile) => renderTile(tile))}
            </div>
         </SortableContext>
      </DndContext>
   );
}
