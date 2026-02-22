import { Button } from "@packages/ui/components/button";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
} from "@packages/ui/components/dropdown-menu";
import { Link } from "@tanstack/react-router";
import {
   ArrowLeft,
   ClipboardList,
   Copy,
   Ellipsis,
   Loader2,
   Power,
   Save,
   Trash2,
} from "lucide-react";
import { InlineEditableText } from "@/features/analytics/ui/inline-editable-text";

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
   backTo: { slug: string; teamSlug: string };
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
   backTo,
}: FormHeaderProps) {
   return (
      <div className="border-b bg-background">
         <div className="container mx-auto px-4 py-4">
            <div className="flex items-start justify-between gap-4">
               <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                     <Link
                        className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                        // biome-ignore lint/suspicious/noExplicitAny: TanStack Router param typing
                        params={backTo as any}
                        to="/$slug/$teamSlug/forms"
                     >
                        <ArrowLeft className="size-5" />
                     </Link>
                     <ClipboardList className="size-5 flex-shrink-0 text-muted-foreground" />
                     <InlineEditableText
                        className="text-2xl font-semibold"
                        onSave={onNameChange}
                        placeholder="Nome do formulário"
                        value={name}
                     />
                  </div>
                  <div className="pl-[68px]">
                     <InlineEditableText
                        className="text-sm text-muted-foreground"
                        onSave={onDescriptionChange}
                        placeholder="Adicionar descrição..."
                        value={description}
                     />
                  </div>
               </div>

               <div className="flex items-center gap-2 flex-shrink-0">
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
               </div>
            </div>
         </div>
      </div>
   );
}
