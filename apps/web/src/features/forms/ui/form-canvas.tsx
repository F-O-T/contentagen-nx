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
import { Button } from "@packages/ui/components/button";
import { Input } from "@packages/ui/components/input";
import { Label } from "@packages/ui/components/label";
import { Switch } from "@packages/ui/components/switch";
import { Textarea } from "@packages/ui/components/textarea";
import { cn } from "@packages/ui/lib/utils";
import {
   AlignLeft,
   CheckSquare,
   ChevronDown,
   GripVertical,
   Mail,
   Trash2,
   Type,
} from "lucide-react";
import type { DragEvent } from "react";
import type { FieldType } from "./field-palette";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface FormField {
   id: string;
   type: FieldType;
   label: string;
   placeholder?: string;
   required: boolean;
   options?: string[];
}

interface FormCanvasProps {
   fields: FormField[];
   onFieldsReorder: (fields: FormField[]) => void;
   onFieldUpdate: (id: string, updates: Partial<FormField>) => void;
   onFieldRemove: (id: string) => void;
   onDropNewField: (type: FieldType) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Field type metadata
// ─────────────────────────────────────────────────────────────────────────────

const FIELD_ICONS: Record<FieldType, React.ReactNode> = {
   text: <Type className="size-3.5" />,
   email: <Mail className="size-3.5" />,
   textarea: <AlignLeft className="size-3.5" />,
   checkbox: <CheckSquare className="size-3.5" />,
   select: <ChevronDown className="size-3.5" />,
};

const FIELD_TYPE_LABELS: Record<FieldType, string> = {
   text: "Texto",
   email: "E-mail",
   textarea: "Texto longo",
   checkbox: "Checkbox",
   select: "Seleção",
};

// ─────────────────────────────────────────────────────────────────────────────
// Sortable Field Card
// ─────────────────────────────────────────────────────────────────────────────

interface SortableFieldCardProps {
   field: FormField;
   onUpdate: (updates: Partial<FormField>) => void;
   onRemove: () => void;
}

function SortableFieldCard({
   field,
   onUpdate,
   onRemove,
}: SortableFieldCardProps) {
   const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
   } = useSortable({ id: field.id });

   const style = {
      transform: CSS.Transform.toString(transform),
      transition,
   };

   return (
      <div
         className={cn(
            "group relative rounded-lg border bg-card",
            "transition-shadow duration-150",
            isDragging
               ? "shadow-lg ring-2 ring-primary/20 z-10 opacity-90"
               : "shadow-sm hover:shadow-md",
         )}
         ref={setNodeRef}
         style={style}
      >
         {/* Header: grip handle + type badge + delete */}
         <div className="flex items-center gap-2 px-3 py-2 border-b border-border/50">
            <button
               className={cn(
                  "flex items-center justify-center size-6 rounded",
                  "text-muted-foreground hover:text-foreground",
                  "cursor-grab active:cursor-grabbing",
                  "transition-colors duration-100",
               )}
               type="button"
               {...attributes}
               {...listeners}
            >
               <GripVertical className="size-4" />
            </button>

            <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
               {FIELD_ICONS[field.type]}
               {FIELD_TYPE_LABELS[field.type]}
            </span>

            <div className="ml-auto flex items-center gap-2">
               <div className="flex items-center gap-1.5">
                  <Label
                     className="text-xs text-muted-foreground cursor-pointer select-none"
                     htmlFor={`required-${field.id}`}
                  >
                     Obrigatório
                  </Label>
                  <Switch
                     checked={field.required}
                     id={`required-${field.id}`}
                     onCheckedChange={(checked) =>
                        onUpdate({ required: checked === true })
                     }
                  />
               </div>
               <Button
                  className="size-7 text-muted-foreground hover:text-destructive"
                  onClick={onRemove}
                  size="icon"
                  type="button"
                  variant="ghost"
               >
                  <Trash2 className="size-3.5" />
                  <span className="sr-only">Remover campo</span>
               </Button>
            </div>
         </div>

         {/* Body: editable config */}
         <div className="p-3 space-y-3">
            {/* Label */}
            <div className="space-y-1">
               <Label
                  className="text-xs font-medium text-muted-foreground"
                  htmlFor={`label-${field.id}`}
               >
                  Rotulo
               </Label>
               <Input
                  className="h-8 text-sm"
                  id={`label-${field.id}`}
                  onChange={(e) => onUpdate({ label: e.target.value })}
                  placeholder="Nome do campo"
                  value={field.label}
               />
            </div>

            {/* Placeholder (not for checkbox) */}
            {field.type !== "checkbox" && (
               <div className="space-y-1">
                  <Label
                     className="text-xs font-medium text-muted-foreground"
                     htmlFor={`placeholder-${field.id}`}
                  >
                     Texto placeholder
                  </Label>
                  <Input
                     className="h-8 text-sm"
                     id={`placeholder-${field.id}`}
                     onChange={(e) => onUpdate({ placeholder: e.target.value })}
                     placeholder="Texto exibido quando vazio"
                     value={field.placeholder ?? ""}
                  />
               </div>
            )}

            {/* Options (select only) */}
            {field.type === "select" && (
               <div className="space-y-1">
                  <Label
                     className="text-xs font-medium text-muted-foreground"
                     htmlFor={`options-${field.id}`}
                  >
                     Opcoes (uma por linha)
                  </Label>
                  <Textarea
                     className="text-sm resize-none"
                     id={`options-${field.id}`}
                     onChange={(e) =>
                        onUpdate({
                           options: e.target.value
                              .split("\n")
                              .filter((o) => o.trim() !== ""),
                        })
                     }
                     placeholder={"Opcao 1\nOpcao 2\nOpcao 3"}
                     rows={3}
                     value={(field.options ?? []).join("\n")}
                  />
               </div>
            )}
         </div>
      </div>
   );
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty State
// ─────────────────────────────────────────────────────────────────────────────

function CanvasEmptyState({ isDragOver }: { isDragOver: boolean }) {
   return (
      <div
         className={cn(
            "flex flex-col items-center justify-center py-16 px-8",
            "border-2 border-dashed rounded-xl",
            "transition-all duration-200",
            isDragOver
               ? "border-primary/50 bg-primary/5"
               : "border-muted-foreground/20 bg-muted/30",
         )}
      >
         <div
            className={cn(
               "size-12 rounded-full flex items-center justify-center mb-4",
               "bg-muted text-muted-foreground",
            )}
         >
            <AlignLeft className="size-5" />
         </div>
         <p className="text-sm font-medium text-foreground">
            Nenhum campo adicionado
         </p>
         <p className="text-xs text-muted-foreground mt-1 text-center max-w-[260px]">
            Arraste campos da paleta ou clique para adicionar ao formulario
         </p>
      </div>
   );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Canvas
// ─────────────────────────────────────────────────────────────────────────────

export function FormCanvas({
   fields,
   onFieldsReorder,
   onFieldUpdate,
   onFieldRemove,
   onDropNewField,
}: FormCanvasProps) {
   const sensors = useSensors(
      useSensor(PointerSensor, {
         activationConstraint: { distance: 5 },
      }),
      useSensor(KeyboardSensor, {
         coordinateGetter: sortableKeyboardCoordinates,
      }),
   );

   const handleDragEnd = (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = fields.findIndex((f) => f.id === active.id);
      const newIndex = fields.findIndex((f) => f.id === over.id);

      if (oldIndex === -1 || newIndex === -1) return;

      const updated = [...fields];
      const [removed] = updated.splice(oldIndex, 1);
      updated.splice(newIndex, 0, removed);
      onFieldsReorder(updated);
   };

   // Handle HTML5 native drop for fields dragged from palette
   const handleNativeDragOver = (e: DragEvent<HTMLDivElement>) => {
      if (e.dataTransfer.types.includes("application/form-field-type")) {
         e.preventDefault();
         e.dataTransfer.dropEffect = "copy";
      }
   };

   const handleNativeDrop = (e: DragEvent<HTMLDivElement>) => {
      const type = e.dataTransfer.getData("application/form-field-type");
      if (type) {
         e.preventDefault();
         onDropNewField(type as FieldType);
      }
   };

   const fieldIds = fields.map((f) => f.id);

   return (
      // biome-ignore lint/a11y/noStaticElementInteractions: Drop zone for HTML5 drag-and-drop from field palette
      <div
         className="flex-1 min-w-0"
         onDragOver={handleNativeDragOver}
         onDrop={handleNativeDrop}
      >
         {fields.length === 0 ? (
            <CanvasEmptyState isDragOver={false} />
         ) : (
            <DndContext
               collisionDetection={closestCenter}
               onDragEnd={handleDragEnd}
               sensors={sensors}
            >
               <SortableContext
                  items={fieldIds}
                  strategy={verticalListSortingStrategy}
               >
                  <div className="flex flex-col gap-3">
                     {fields.map((field) => (
                        <SortableFieldCard
                           field={field}
                           key={field.id}
                           onRemove={() => onFieldRemove(field.id)}
                           onUpdate={(updates) =>
                              onFieldUpdate(field.id, updates)
                           }
                        />
                     ))}
                  </div>
               </SortableContext>
            </DndContext>
         )}
      </div>
   );
}
