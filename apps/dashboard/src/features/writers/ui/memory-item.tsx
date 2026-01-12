import type { InstructionMemoryItem } from "@packages/database/schemas/instruction-memory";
import { Button } from "@packages/ui/components/button";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
} from "@packages/ui/components/dropdown-menu";
import { Switch } from "@packages/ui/components/switch";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useAlertDialog } from "@/hooks/use-alert-dialog";

type MemoryItemProps = {
   memory: InstructionMemoryItem;
   onToggle: () => void;
   onEdit: () => void;
   onDelete: () => void;
   isToggling?: boolean;
   isDeleting?: boolean;
};

export function MemoryItem({
   memory,
   onToggle,
   onEdit,
   onDelete,
   isToggling,
   isDeleting,
}: MemoryItemProps) {
   const { openAlertDialog } = useAlertDialog();

   const handleDeleteClick = () => {
      openAlertDialog({
         title: "Excluir memória",
         description: `Tem certeza que deseja excluir a memória "${memory.title}"? Esta ação não pode ser desfeita.`,
         actionLabel: "Excluir",
         cancelLabel: "Cancelar",
         variant: "destructive",
         onAction: onDelete,
      });
   };

   // Truncate content for preview
   const contentPreview =
      memory.content.length > 150
         ? `${memory.content.slice(0, 150)}...`
         : memory.content;

   return (
      <div className="flex items-start gap-4 py-4">
         {/* Toggle Switch */}
         <div className="pt-0.5">
            <Switch
               checked={memory.enabled}
               disabled={isToggling}
               onCheckedChange={onToggle}
            />
         </div>

         {/* Content */}
         <div className="flex-1 min-w-0">
            <h4
               className={`font-medium text-sm ${
                  memory.enabled ? "" : "text-muted-foreground"
               }`}
            >
               {memory.title}
            </h4>
            <p
               className={`text-sm mt-1 whitespace-pre-wrap ${
                  memory.enabled
                     ? "text-muted-foreground"
                     : "text-muted-foreground/60"
               }`}
            >
               {contentPreview}
            </p>
         </div>

         {/* Actions */}
         <DropdownMenu>
            <DropdownMenuTrigger asChild>
               <Button
                  className="size-8"
                  disabled={isDeleting}
                  size="icon"
                  variant="ghost"
               >
                  <MoreHorizontal className="size-4" />
               </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
               <DropdownMenuItem onClick={onEdit}>
                  <Pencil className="size-4 mr-2" />
                  {"Editar"}
               </DropdownMenuItem>
               <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={handleDeleteClick}
               >
                  <Trash2 className="size-4 mr-2" />
                  {"Excluir"}
               </DropdownMenuItem>
            </DropdownMenuContent>
         </DropdownMenu>
      </div>
   );
}
