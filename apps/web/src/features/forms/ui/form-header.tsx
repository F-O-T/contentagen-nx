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
   Copy,
   Ellipsis,
   Loader2,
   Power,
   Save,
   Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
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
            <div className="flex flex-col gap-2">
               <PageHeader
                  editable
                  leading={
                     <Link
                        className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                        // biome-ignore lint/suspicious/noExplicitAny: TanStack Router param typing
                        params={backTo as any}
                        to="/$slug/$teamSlug/forms"
                     >
                        <ArrowLeft className="size-5" />
                     </Link>
                  }
                  onTitleChange={onNameChange}
                  title={name}
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
               <div className="pl-10">
                  <InlineEditableText
                     className="text-sm text-muted-foreground"
                     onSave={onDescriptionChange}
                     placeholder="Adicionar descrição..."
                     value={description}
                  />
               </div>
            </div>
         </div>
      </div>
   );
}
