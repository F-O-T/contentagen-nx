/**
 * Barra de navegacao superior do editor IDE.
 * Mantem o botao voltar e expõe todas as acoes principais como icones com tooltips.
 */
import { Button } from "@packages/ui/components/button";
import {
   Tooltip,
   TooltipContent,
   TooltipTrigger,
} from "@packages/ui/components/tooltip";
import { cn } from "@packages/ui/lib/utils";
import {
   Archive,
   ArrowLeft,
   Check,
   CheckCircle,
   Copy,
   ExternalLink,
   Loader2,
   Save,
   Trash2,
} from "lucide-react";
import { useIsDirty } from "./hooks/use-editor-state";

interface EditorNavBarProps {
   slug: string;
   status: string;
   onBack: () => void;
   onSave: () => void;
   onPublish: () => void;
   onArchive: () => void;
   onDelete: () => void;
   isSaving?: boolean;
   className?: string;
}

export function EditorNavBar({
   slug,
   status,
   onBack,
   onSave,
   onPublish,
   onArchive,
   onDelete,
   isSaving = false,
   className,
}: EditorNavBarProps) {
   const isDirty = useIsDirty();
   const filename = slug ? `${slug}.md` : "sem-titulo.md";

   const handleCopyPath = () => {
      const path = `content/${filename}`;
      navigator.clipboard.writeText(path);
   };

   return (
      <div
         className={cn(
            "flex items-center justify-between h-12 px-3 border-b bg-background",
            className,
         )}
      >
         <div className="flex items-center">
            <Tooltip>
               <TooltipTrigger asChild>
                  <Button
                     className="size-8"
                     onClick={onBack}
                     size="icon"
                     variant="ghost"
                  >
                     <ArrowLeft className="size-4" />
                  </Button>
               </TooltipTrigger>
               <TooltipContent side="bottom">
                  Voltar para conteúdos
               </TooltipContent>
            </Tooltip>
         </div>

         <div className="flex items-center gap-2">
            {/* Auto-save status indicator */}
            {isSaving && (
               <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Loader2 className="size-3 animate-spin" />
                  <span>Salvando...</span>
               </div>
            )}

            {!isSaving && !isDirty && (
               <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Check className="size-3" />
                  <span>Todas as alterações salvas</span>
               </div>
            )}

            {/* Manual save button - only show when dirty and not saving */}
            {isDirty && !isSaving && (
               <Tooltip>
                  <TooltipTrigger asChild>
                     <Button
                        className="size-8"
                        onClick={onSave}
                        size="icon"
                        variant="ghost"
                     >
                        <Save className="size-4" />
                     </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                     <div>Salvar agora</div>
                     <div className="text-[10px] text-muted-foreground">
                        Ctrl+S (auto-save: 2s)
                     </div>
                  </TooltipContent>
               </Tooltip>
            )}

            {status === "draft" && (
               <Tooltip>
                  <TooltipTrigger asChild>
                     <Button
                        className="size-8"
                        onClick={onPublish}
                        size="icon"
                        variant="default"
                     >
                        <CheckCircle className="size-4" />
                     </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Publicar</TooltipContent>
               </Tooltip>
            )}

            <Tooltip>
               <TooltipTrigger asChild>
                  <Button
                     className="size-8"
                     onClick={handleCopyPath}
                     size="icon"
                     variant="ghost"
                  >
                     <Copy className="size-4" />
                  </Button>
               </TooltipTrigger>
               <TooltipContent side="bottom">Copiar caminho</TooltipContent>
            </Tooltip>

            {status === "published" && (
               <Tooltip>
                  <TooltipTrigger asChild>
                     <Button
                        className="size-8"
                        disabled
                        size="icon"
                        variant="ghost"
                     >
                        <ExternalLink className="size-4" />
                     </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Abrir publicado</TooltipContent>
               </Tooltip>
            )}

            {status !== "archived" && (
               <Tooltip>
                  <TooltipTrigger asChild>
                     <Button
                        className="size-8"
                        onClick={onArchive}
                        size="icon"
                        variant="ghost"
                     >
                        <Archive className="size-4" />
                     </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Arquivar</TooltipContent>
               </Tooltip>
            )}

            <Tooltip>
               <TooltipTrigger asChild>
                  <Button
                     className="size-8 text-destructive hover:bg-destructive/10 focus-visible:outline-destructive"
                     onClick={onDelete}
                     size="icon"
                     variant="ghost"
                  >
                     <Trash2 className="size-4" />
                  </Button>
               </TooltipTrigger>
               <TooltipContent side="bottom">Excluir</TooltipContent>
            </Tooltip>
         </div>
      </div>
   );
}
