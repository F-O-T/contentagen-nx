import {
   closestCenter,
   DndContext,
   type DragEndEvent,
   KeyboardSensor,
   PointerSensor,
   useSensor,
   useSensors,
} from "@dnd-kit/core";
import {
   SortableContext,
   sortableKeyboardCoordinates,
   useSortable,
   verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import { cn } from "@packages/ui/lib/utils";
import { useNavigate, useParams } from "@tanstack/react-router";
import { ExternalLink, GripVertical, Network, X } from "lucide-react";

export interface SatelliteItem {
   id: string;
   contentId: string;
   title: string;
   status: string;
}

interface SortableSatelliteCardProps {
   item: SatelliteItem;
   onRemove: (contentId: string) => void;
   isRemoving: boolean;
   slug: string;
   teamSlug: string;
}

function SortableSatelliteCard({
   item,
   onRemove,
   isRemoving,
   slug,
   teamSlug,
}: SortableSatelliteCardProps) {
   const navigate = useNavigate();
   const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
   } = useSortable({ id: item.id });

   const style = {
      transform: CSS.Transform.toString(transform),
      transition,
   };

   return (
      <div
         className={cn(
            "flex items-center gap-3 p-3 border rounded-lg bg-card",
            "transition-shadow duration-150",
            isDragging
               ? "shadow-lg ring-2 ring-primary/20 opacity-90 z-10"
               : "shadow-sm hover:shadow-md",
         )}
         ref={setNodeRef}
         style={style}
      >
         <button
            className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing transition-colors"
            type="button"
            {...attributes}
            {...listeners}
         >
            <GripVertical className="size-4" />
         </button>

         <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{item.title}</p>
         </div>

         <Badge variant={item.status === "published" ? "default" : "outline"}>
            {item.status === "published" ? "Publicado" : "Rascunho"}
         </Badge>

         <Button
            onClick={() =>
               navigate({
                  to: "/$slug/$teamSlug/$contentId",
                  params: { slug, teamSlug, contentId: item.contentId },
               })
            }
            size="sm"
            variant="ghost"
         >
            <ExternalLink className="size-3.5 mr-1" />
            Editar
         </Button>

         <Button
            disabled={isRemoving}
            onClick={() => onRemove(item.contentId)}
            size="sm"
            variant="ghost"
         >
            <X className="size-4 text-muted-foreground hover:text-destructive" />
         </Button>
      </div>
   );
}

interface SatelliteCanvasProps {
   satellites: SatelliteItem[];
   onReorder: (reordered: SatelliteItem[]) => void;
   onRemove: (contentId: string) => void;
   isRemoving: boolean;
}

export function SatelliteCanvas({
   satellites,
   onReorder,
   onRemove,
   isRemoving,
}: SatelliteCanvasProps) {
   const { slug, teamSlug } = useParams({ strict: false }) as {
      slug: string;
      teamSlug: string;
   };

   const sensors = useSensors(
      useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
      useSensor(KeyboardSensor, {
         coordinateGetter: sortableKeyboardCoordinates,
      }),
   );

   const handleDragEnd = (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = satellites.findIndex((s) => s.id === active.id);
      const newIndex = satellites.findIndex((s) => s.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const updated = [...satellites];
      const [removed] = updated.splice(oldIndex, 1);
      updated.splice(newIndex, 0, removed);
      onReorder(updated);
   };

   if (satellites.length === 0) {
      return (
         <div className="flex flex-col items-center justify-center py-16 px-8 border-2 border-dashed rounded-xl border-muted-foreground/20 bg-muted/30">
            <div className="size-12 rounded-full flex items-center justify-center mb-4 bg-muted text-muted-foreground">
               <Network className="size-5" />
            </div>
            <p className="text-sm font-medium text-foreground">
               Nenhum satélite adicionado
            </p>
            <p className="text-xs text-muted-foreground mt-1 text-center max-w-[260px]">
               Use o painel ao lado para adicionar posts satélite a este
               cluster.
            </p>
         </div>
      );
   }

   return (
      <DndContext
         collisionDetection={closestCenter}
         onDragEnd={handleDragEnd}
         sensors={sensors}
      >
         <SortableContext
            items={satellites.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
         >
            <div className="flex flex-col gap-2">
               {satellites.map((item) => (
                  <SortableSatelliteCard
                     isRemoving={isRemoving}
                     item={item}
                     key={item.id}
                     onRemove={onRemove}
                     slug={slug}
                     teamSlug={teamSlug}
                  />
               ))}
            </div>
         </SortableContext>
      </DndContext>
   );
}
