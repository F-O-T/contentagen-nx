import { Button } from "@packages/ui/components/button";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
} from "@packages/ui/components/dropdown-menu";
import { Copy, Ellipsis, Loader2, Save, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";

interface InsightHeaderProps {
   name: string;
   description: string;
   onNameChange: (name: string) => void;
   onDescriptionChange: (description: string) => void;
   onSave: () => void;
   isSaving: boolean;
   onDuplicate?: () => void;
   onDelete?: () => void;
}

export function InsightHeader({
   name,
   description,
   onNameChange,
   onDescriptionChange,
   onSave,
   isSaving,
   onDuplicate,
   onDelete,
}: InsightHeaderProps) {
   return (
      <PageHeader
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
                        <>
                           <DropdownMenuItem onClick={onDuplicate}>
                              <Copy className="size-4 mr-2" />
                              Duplicar
                           </DropdownMenuItem>
                           <DropdownMenuSeparator />
                        </>
                     )}
                     {onDelete && (
                        <DropdownMenuItem
                           className="text-destructive focus:text-destructive"
                           onClick={onDelete}
                        >
                           <Trash2 className="size-4 mr-2" />
                           Deletar
                        </DropdownMenuItem>
                     )}
                  </DropdownMenuContent>
               </DropdownMenu>
            </>
         }
         className="pb-3"
         description={description}
         editable
         onDescriptionChange={onDescriptionChange}
         onTitleChange={onNameChange}
         title={name}
         titlePlaceholder="Nome do insight"
      />
   );
}
