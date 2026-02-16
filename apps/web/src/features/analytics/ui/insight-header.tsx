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
   Filter,
   Loader2,
   type LucideIcon,
   RefreshCcw,
   Save,
   Trash2,
   TrendingUp,
} from "lucide-react";
import type { InsightType } from "@/features/analytics/hooks/use-insight-config";
import { InlineEditableText } from "./inline-editable-text";

const TYPE_ICON: Record<InsightType, LucideIcon> = {
   trends: TrendingUp,
   funnels: Filter,
   retention: RefreshCcw,
};

interface InsightHeaderProps {
   name: string;
   description: string;
   type: InsightType;
   onNameChange: (name: string) => void;
   onDescriptionChange: (description: string) => void;
   onSave: () => void;
   isSaving: boolean;
   onDuplicate?: () => void;
   onDelete?: () => void;
   backTo: { slug: string; teamSlug: string };
}

export function InsightHeader({
   name,
   description,
   type,
   onNameChange,
   onDescriptionChange,
   onSave,
   isSaving,
   onDuplicate,
   onDelete,
   backTo,
}: InsightHeaderProps) {
   const TypeIcon = TYPE_ICON[type];

   return (
      <div className="border-b bg-background">
         <div className="container mx-auto px-4 py-4">
            <div className="flex items-start justify-between gap-4">
               <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                     <Link
                        className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                        params={backTo as never}
                        to="/$slug/$teamSlug/analytics/insights"
                     >
                        <ArrowLeft className="size-5" />
                     </Link>
                     <TypeIcon className="size-5 flex-shrink-0 text-muted-foreground" />
                     <InlineEditableText
                        className="text-2xl font-semibold"
                        onSave={onNameChange}
                        placeholder="Nome do insight"
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
               </div>
            </div>
         </div>
      </div>
   );
}
