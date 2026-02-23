import { Button } from "@packages/ui/components/button";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
} from "@packages/ui/components/dropdown-menu";
import {
   Code2,
   Ellipsis,
   Loader2,
   Save,
   Trash2,
   TrendingUp,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";

interface ClusterBuilderHeaderProps {
   pillarTitle: string;
   onTitleChange: (title: string) => void;
   onSave: () => void;
   isSaving: boolean;
   isNew: boolean;
   onDelete?: () => void;
   onPromote?: () => void;
   onOpenEmbed?: () => void;
}

export function ClusterBuilderHeader({
   pillarTitle,
   onTitleChange,
   onSave,
   isSaving,
   isNew,
   onDelete,
   onPromote,
   onOpenEmbed,
}: ClusterBuilderHeaderProps) {
   return (
      <div className="border-b bg-background sticky top-0 z-10">
         <div className="container mx-auto px-4 py-4">
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
                              {isNew ? "Criar cluster" : "Salvar"}
                           </>
                        )}
                     </Button>
                     {!isNew && (onPromote || onDelete || onOpenEmbed) && (
                        <DropdownMenu>
                           <DropdownMenuTrigger asChild>
                              <Button
                                 aria-label="Mais ações"
                                 size="icon"
                                 variant="outline"
                              >
                                 <Ellipsis className="size-4" />
                              </Button>
                           </DropdownMenuTrigger>
                           <DropdownMenuContent align="end">
                              {onPromote && (
                                 <>
                                    <DropdownMenuItem onClick={onPromote}>
                                       <TrendingUp className="size-4 mr-2" />
                                       Promover pillar
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                 </>
                              )}
                              {onOpenEmbed && (
                                 <DropdownMenuItem onClick={onOpenEmbed}>
                                    <Code2 className="size-4 mr-2" />
                                    Embed
                                 </DropdownMenuItem>
                              )}
                              {onDelete && (
                                 <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={onDelete}
                                 >
                                    <Trash2 className="size-4 mr-2" />
                                    Deletar cluster
                                 </DropdownMenuItem>
                              )}
                           </DropdownMenuContent>
                        </DropdownMenu>
                     )}
                  </>
               }
               editable
               onTitleChange={onTitleChange}
               title={pillarTitle}
               titlePlaceholder="Nome do cluster"
            />
         </div>
      </div>
   );
}
