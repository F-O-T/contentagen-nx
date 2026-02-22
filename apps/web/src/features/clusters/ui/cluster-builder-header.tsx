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
   Ellipsis,
   Loader2,
   Network,
   Save,
   Trash2,
   TrendingUp,
} from "lucide-react";
import { InlineEditableText } from "@/features/analytics/ui/inline-editable-text";

interface ClusterBuilderHeaderProps {
   pillarTitle: string;
   onTitleChange: (title: string) => void;
   onSave: () => void;
   isSaving: boolean;
   isNew: boolean;
   onDelete?: () => void;
   onPromote?: () => void;
   backTo: { slug: string; teamSlug: string };
}

export function ClusterBuilderHeader({
   pillarTitle,
   onTitleChange,
   onSave,
   isSaving,
   isNew,
   onDelete,
   onPromote,
   backTo,
}: ClusterBuilderHeaderProps) {
   return (
      <div className="border-b bg-background sticky top-0 z-10">
         <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between gap-4">
               <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Link
                     className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                     params={backTo as never}
                     to="/$slug/$teamSlug/clusters"
                  >
                     <ArrowLeft className="size-5" />
                  </Link>
                  <Network className="size-5 flex-shrink-0 text-muted-foreground" />
                  <InlineEditableText
                     className="text-2xl font-semibold font-serif"
                     onSave={onTitleChange}
                     placeholder="Nome do cluster"
                     value={pillarTitle}
                  />
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
                           {isNew ? "Criar cluster" : "Salvar"}
                        </>
                     )}
                  </Button>

                  {!isNew && (
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                           <Button size="icon" variant="outline">
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
               </div>
            </div>
         </div>
      </div>
   );
}
