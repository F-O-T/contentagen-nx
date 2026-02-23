import { Button } from "@packages/ui/components/button";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
} from "@packages/ui/components/dropdown-menu";
import {
   Copy,
   Ellipsis,
   Loader2,
   Power,
   Save,
   Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface FormHeaderProps {
   name: string;
   description: string;
   isActive: boolean;
   onNameChange: (name: string) => void;
   onDescriptionChange: (description: string) => void;
   onSave: () => void;
   isSaving: boolean;
   onDuplicate?: () => void;
   onToggleActive?: () => void;
   onDelete?: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Form Header
// ─────────────────────────────────────────────────────────────────────────────

export function FormHeader({
   name,
   description,
   isActive,
   onNameChange,
   onDescriptionChange,
   onSave,
   isSaving,
   onDuplicate,
   onToggleActive,
   onDelete,
}: FormHeaderProps) {
   return (
      <PageHeader
         className="pb-3"
         editable
         onTitleChange={onNameChange}
         onDescriptionChange={onDescriptionChange}
         title={name}
         description={description}
         titlePlaceholder="Nome do formulário"
         actions={
            <>
               <Button disabled={isSaving} onClick={onSave}>
                  {isSaving ? (
                     <>
                        <Loader2 className="size-4 mr-2 animate-spin" />
                        Salvando...
                     </>
                  ) : (
                     <>
                        <Save className="size-4 mr-2" />
                        Salvar
                     </>
                  )}
               </Button>
               <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                     <Button size="icon" variant="outline">
                        <Ellipsis className="size-4" />
                     </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                     {onDuplicate && (
                        <DropdownMenuItem onClick={onDuplicate}>
                           <Copy className="size-4 mr-2" />
                           Duplicar
                        </DropdownMenuItem>
                     )}
                     {onToggleActive && (
                        <DropdownMenuItem onClick={onToggleActive}>
                           <Power className="size-4 mr-2" />
                           {isActive ? "Desativar" : "Ativar"}
                        </DropdownMenuItem>
                     )}
                     {onDelete && (
                        <>
                           <DropdownMenuSeparator />
                           <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={onDelete}
                           >
                              <Trash2 className="size-4 mr-2" />
                              Deletar
                           </DropdownMenuItem>
                        </>
                     )}
                  </DropdownMenuContent>
               </DropdownMenu>
            </>
         }
      />
   );
}
