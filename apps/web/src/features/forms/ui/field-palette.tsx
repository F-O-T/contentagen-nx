import { cn } from "@packages/ui/lib/utils";
import { AlignLeft, CheckSquare, ChevronDown, Mail, Type } from "lucide-react";
import type { DragEvent } from "react";

export type FieldType = "text" | "email" | "textarea" | "checkbox" | "select";

interface FieldTypeOption {
   type: FieldType;
   label: string;
   icon: React.ReactNode;
   description: string;
}

const FIELD_TYPES: FieldTypeOption[] = [
   {
      type: "text",
      label: "Texto",
      icon: <Type className="size-4" />,
      description: "Campo de texto simples",
   },
   {
      type: "email",
      label: "E-mail",
      icon: <Mail className="size-4" />,
      description: "Campo de e-mail com validação",
   },
   {
      type: "textarea",
      label: "Texto longo",
      icon: <AlignLeft className="size-4" />,
      description: "Área de texto multilinha",
   },
   {
      type: "checkbox",
      label: "Checkbox",
      icon: <CheckSquare className="size-4" />,
      description: "Caixa de seleção",
   },
   {
      type: "select",
      label: "Seleção",
      icon: <ChevronDown className="size-4" />,
      description: "Menu de seleção com opções",
   },
];

interface FieldPaletteProps {
   onAddField: (type: FieldType) => void;
}

export function FieldPalette({ onAddField }: FieldPaletteProps) {
   const handleDragStart = (
      e: DragEvent<HTMLButtonElement>,
      type: FieldType,
   ) => {
      e.dataTransfer.setData("application/form-field-type", type);
      e.dataTransfer.effectAllowed = "copy";
   };

   return (
      <aside className="w-[260px] flex-shrink-0">
         <div className="sticky top-4 space-y-3">
            <div>
               <h3 className="text-sm font-semibold text-foreground tracking-tight">
                  Campos disponíveis
               </h3>
               <p className="text-xs text-muted-foreground mt-0.5">
                  Clique ou arraste para adicionar
               </p>
            </div>

            <div className="flex flex-col gap-1.5">
               {FIELD_TYPES.map((fieldType) => (
                  <button
                     className={cn(
                        "group flex items-center gap-3 rounded-lg border border-transparent px-3 py-2.5",
                        "text-left text-sm transition-all duration-150",
                        "hover:bg-accent hover:border-border",
                        "active:scale-[0.98]",
                        "cursor-grab active:cursor-grabbing",
                     )}
                     draggable
                     key={fieldType.type}
                     onClick={() => onAddField(fieldType.type)}
                     onDragStart={(e) => handleDragStart(e, fieldType.type)}
                     type="button"
                  >
                     <span
                        className={cn(
                           "flex items-center justify-center size-8 rounded-md",
                           "bg-muted text-muted-foreground",
                           "group-hover:bg-primary/10 group-hover:text-primary",
                           "transition-colors duration-150",
                        )}
                     >
                        {fieldType.icon}
                     </span>
                     <span className="flex flex-col min-w-0">
                        <span className="font-medium text-foreground leading-tight">
                           {fieldType.label}
                        </span>
                        <span className="text-xs text-muted-foreground leading-tight mt-0.5">
                           {fieldType.description}
                        </span>
                     </span>
                  </button>
               ))}
            </div>
         </div>
      </aside>
   );
}
