import {
   Collapsible,
   CollapsibleContent,
   CollapsibleTrigger,
} from "@packages/ui/components/collapsible";
import { cn } from "@packages/ui/lib/utils";
import {
   AlignLeft,
   Calendar,
   CheckSquare,
   ChevronDown,
   ChevronRight,
   Hash,
   Mail,
   Paperclip,
   Star,
   Type,
} from "lucide-react";
import type { DragEvent } from "react";

export type FieldType =
   | "text"
   | "email"
   | "textarea"
   | "checkbox"
   | "select"
   | "number"
   | "date"
   | "rating"
   | "file";

interface FieldTypeOption {
   type: FieldType;
   label: string;
   icon: React.ReactNode;
   description: string;
   group: "basic" | "advanced";
}

const FIELD_TYPES: FieldTypeOption[] = [
   {
      type: "text",
      label: "Texto",
      icon: <Type className="size-4" />,
      description: "Campo de texto simples",
      group: "basic",
   },
   {
      type: "email",
      label: "E-mail",
      icon: <Mail className="size-4" />,
      description: "Campo de e-mail com validação",
      group: "basic",
   },
   {
      type: "textarea",
      label: "Texto longo",
      icon: <AlignLeft className="size-4" />,
      description: "Área de texto multilinha",
      group: "basic",
   },
   {
      type: "checkbox",
      label: "Checkbox",
      icon: <CheckSquare className="size-4" />,
      description: "Caixa de seleção",
      group: "basic",
   },
   {
      type: "select",
      label: "Seleção",
      icon: <ChevronDown className="size-4" />,
      description: "Menu de seleção com opções",
      group: "basic",
   },
   {
      type: "number",
      label: "Número",
      icon: <Hash className="size-4" />,
      description: "Campo numérico",
      group: "advanced",
   },
   {
      type: "date",
      label: "Data",
      icon: <Calendar className="size-4" />,
      description: "Seletor de data",
      group: "advanced",
   },
   {
      type: "rating",
      label: "Avaliação",
      icon: <Star className="size-4" />,
      description: "Escala de 1 a 5 estrelas",
      group: "advanced",
   },
   {
      type: "file",
      label: "Arquivo",
      icon: <Paperclip className="size-4" />,
      description: "Upload de arquivo",
      group: "advanced",
   },
];

const BASIC_FIELD_TYPES = FIELD_TYPES.filter((f) => f.group === "basic");
const ADVANCED_FIELD_TYPES = FIELD_TYPES.filter((f) => f.group === "advanced");

interface FieldPaletteProps {
   onAddField: (type: FieldType) => void;
}

interface FieldButtonProps {
   fieldType: FieldTypeOption;
   onAddField: (type: FieldType) => void;
}

function FieldButton({ fieldType, onAddField }: FieldButtonProps) {
   const handleDragStart = (e: DragEvent<HTMLButtonElement>) => {
      e.dataTransfer.setData("application/form-field-type", fieldType.type);
      e.dataTransfer.effectAllowed = "copy";
   };

   return (
      <button
         className={cn(
            "group flex items-center gap-3 rounded-lg border border-transparent px-3 py-2.5",
            "text-left text-sm transition-all duration-150",
            "hover:bg-accent hover:border-border",
            "active:scale-[0.98]",
            "cursor-grab active:cursor-grabbing",
         )}
         draggable
         onClick={() => onAddField(fieldType.type)}
         onDragStart={handleDragStart}
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
   );
}

export function FieldPalette({ onAddField }: FieldPaletteProps) {
   return (
      <div className="space-y-4">
         <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
               Básicos
            </p>
            <div className="flex flex-col gap-1">
               {BASIC_FIELD_TYPES.map((fieldType) => (
                  <FieldButton
                     fieldType={fieldType}
                     key={fieldType.type}
                     onAddField={onAddField}
                  />
               ))}
            </div>
         </div>

         <Collapsible>
            <CollapsibleTrigger className="flex items-center gap-1 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 w-full hover:text-foreground transition-colors">
               <ChevronRight className="size-3 transition-transform [[data-state=open]_&]:rotate-90" />
               Avançados
            </CollapsibleTrigger>
            <CollapsibleContent>
               <div className="flex flex-col gap-1">
                  {ADVANCED_FIELD_TYPES.map((fieldType) => (
                     <FieldButton
                        fieldType={fieldType}
                        key={fieldType.type}
                        onAddField={onAddField}
                     />
                  ))}
               </div>
            </CollapsibleContent>
         </Collapsible>
      </div>
   );
}
