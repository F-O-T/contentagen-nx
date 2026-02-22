"use client";

import { Button } from "@packages/ui/components/button";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
} from "@packages/ui/components/dropdown-menu";
import { Separator } from "@packages/ui/components/separator";
import {
   Tooltip,
   TooltipContent,
   TooltipProvider,
   TooltipTrigger,
} from "@packages/ui/components/tooltip";
import { cn } from "@packages/ui/lib/utils";
import { triggerFloatingLink } from "@platejs/link/react";
import {
   useMarkToolbarButton,
   useMarkToolbarButtonState,
} from "@platejs/utils/react";
import {
   ArrowLeft,
   Bold,
   ChevronDown,
   Italic,
   Link2,
   Link2Off,
   Loader2,
   Save,
   Underline,
} from "lucide-react";
import { useEditorRef } from "platejs/react";

type ContentStatus = "draft" | "published" | "archived";

interface EditorFixedToolbarProps {
   status?: ContentStatus;
   isSaving?: boolean;
   onSave?: () => void;
   onBack?: () => void;
   onStatusChange?: (status: ContentStatus) => void;
   showSidebar?: boolean;
   onToggleSidebar?: () => void;
}

const STATUS_CONFIG: Record<
   ContentStatus,
   { label: string; dot: string; text: string }
> = {
   draft: {
      label: "Rascunho",
      dot: "bg-amber-400",
      text: "text-amber-600 dark:text-amber-400",
   },
   published: {
      label: "Publicado",
      dot: "bg-emerald-500",
      text: "text-emerald-600 dark:text-emerald-400",
   },
   archived: {
      label: "Arquivado",
      dot: "bg-muted-foreground",
      text: "text-muted-foreground",
   },
};

function MarkButton({
   nodeType,
   icon,
   tooltip,
}: {
   nodeType: string;
   icon: React.ReactNode;
   tooltip: string;
}) {
   const state = useMarkToolbarButtonState({ nodeType });
   const { props } = useMarkToolbarButton(state);

   return (
      <Tooltip>
         <TooltipTrigger asChild>
            <Button
               className={cn(
                  "size-7 rounded",
                  state.pressed && "bg-accent text-accent-foreground",
               )}
               size="icon"
               type="button"
               variant="ghost"
               {...props}
            >
               {icon}
            </Button>
         </TooltipTrigger>
         <TooltipContent>{tooltip}</TooltipContent>
      </Tooltip>
   );
}

export function EditorFixedToolbar({
   status = "draft",
   isSaving,
   onSave,
   onBack,
   onStatusChange,
   showSidebar,
   onToggleSidebar,
}: EditorFixedToolbarProps) {
   const editor = useEditorRef();
   const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;

   const handleLinkClick = () => {
      triggerFloatingLink(editor, { focused: true });
   };

   return (
      <TooltipProvider>
         <div className="flex h-11 items-center gap-1.5 border-b px-3 bg-background sticky top-0 z-10">
            {/* Back */}
            <Tooltip>
               <TooltipTrigger asChild>
                  <Button
                     className="size-7 shrink-0 rounded"
                     onClick={onBack}
                     size="icon"
                     type="button"
                     variant="ghost"
                  >
                     <ArrowLeft className="size-4" />
                  </Button>
               </TooltipTrigger>
               <TooltipContent>Voltar</TooltipContent>
            </Tooltip>

            <Separator className="h-4 mx-0.5" orientation="vertical" />

            {/* Formatting marks */}
            <div className="flex items-center gap-0.5">
               <MarkButton
                  icon={<Bold className="size-3.5" />}
                  nodeType="bold"
                  tooltip="Negrito ⌘B"
               />
               <MarkButton
                  icon={<Italic className="size-3.5" />}
                  nodeType="italic"
                  tooltip="Itálico ⌘I"
               />
               <MarkButton
                  icon={<Underline className="size-3.5" />}
                  nodeType="underline"
                  tooltip="Sublinhado ⌘U"
               />

               <Tooltip>
                  <TooltipTrigger asChild>
                     <Button
                        className="size-7 rounded"
                        onClick={handleLinkClick}
                        size="icon"
                        type="button"
                        variant="ghost"
                     >
                        <Link2 className="size-3.5" />
                     </Button>
                  </TooltipTrigger>
                  <TooltipContent>Link ⌘K</TooltipContent>
               </Tooltip>
            </div>

            <Separator className="h-4 mx-0.5" orientation="vertical" />

            {/* Sidebar toggle */}
            {onToggleSidebar && (
               <Tooltip>
                  <TooltipTrigger asChild>
                     <Button
                        className={cn(
                           "size-7 rounded",
                           showSidebar && "bg-accent text-accent-foreground",
                        )}
                        onClick={onToggleSidebar}
                        size="icon"
                        type="button"
                        variant="ghost"
                     >
                        <Link2Off className="size-3.5" />
                     </Button>
                  </TooltipTrigger>
                  <TooltipContent>Links do cluster</TooltipContent>
               </Tooltip>
            )}

            {/* Spacer */}
            <div className="flex-1" />

            {/* Status toggle */}
            {onStatusChange && (
               <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                     <Button
                        className="h-7 gap-1.5 rounded px-2 text-xs font-medium"
                        type="button"
                        variant="ghost"
                     >
                        <span
                           className={cn(
                              "size-1.5 rounded-full shrink-0",
                              cfg.dot,
                           )}
                        />
                        <span className={cn(cfg.text)}>{cfg.label}</span>
                        <ChevronDown className="size-3 text-muted-foreground" />
                     </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                     <DropdownMenuItem
                        className="gap-2 text-xs"
                        onClick={() => onStatusChange("draft")}
                     >
                        <span className="size-1.5 rounded-full bg-amber-400 shrink-0" />
                        Rascunho
                     </DropdownMenuItem>
                     <DropdownMenuItem
                        className="gap-2 text-xs"
                        onClick={() => onStatusChange("published")}
                     >
                        <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
                        Publicado
                     </DropdownMenuItem>
                     <DropdownMenuItem
                        className="gap-2 text-xs"
                        onClick={() => onStatusChange("archived")}
                     >
                        <span className="size-1.5 rounded-full bg-muted-foreground shrink-0" />
                        Arquivado
                     </DropdownMenuItem>
                  </DropdownMenuContent>
               </DropdownMenu>
            )}

            <Separator className="h-4 mx-0.5" orientation="vertical" />

            {/* Save */}
            <Button
               className="h-7 gap-1.5 rounded px-3 text-xs"
               disabled={isSaving}
               onClick={onSave}
               size="sm"
               type="button"
               variant="default"
            >
               {isSaving ? (
                  <Loader2 className="size-3.5 animate-spin" />
               ) : (
                  <Save className="size-3.5" />
               )}
               Salvar
            </Button>
         </div>
      </TooltipProvider>
   );
}
