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
   Archive,
   ArrowLeft,
   Bold,
   Check,
   ChevronDown,
   FileText,
   Globe,
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
   { label: string; dot: string; text: string; Icon: React.ElementType }
> = {
   draft: {
      label: "Rascunho",
      dot: "bg-amber-400",
      text: "text-amber-600 dark:text-amber-400",
      Icon: FileText,
   },
   published: {
      label: "Publicado",
      dot: "bg-emerald-500",
      text: "text-emerald-600 dark:text-emerald-400",
      Icon: Globe,
   },
   archived: {
      label: "Arquivado",
      dot: "bg-muted-foreground",
      text: "text-muted-foreground",
      Icon: Archive,
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
                  "size-8 rounded",
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
         <div className="flex h-12 items-center gap-1.5 border-b px-3 bg-background sticky top-0 z-10">
            {/* Back */}
            <Tooltip>
               <TooltipTrigger asChild>
                  <Button
                     className="size-8 shrink-0 rounded"
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
                  icon={<Bold className="size-4" />}
                  nodeType="bold"
                  tooltip="Negrito ⌘B"
               />
               <MarkButton
                  icon={<Italic className="size-4" />}
                  nodeType="italic"
                  tooltip="Itálico ⌘I"
               />
               <MarkButton
                  icon={<Underline className="size-4" />}
                  nodeType="underline"
                  tooltip="Sublinhado ⌘U"
               />

               <Tooltip>
                  <TooltipTrigger asChild>
                     <Button
                        className="size-8 rounded"
                        onClick={handleLinkClick}
                        size="icon"
                        type="button"
                        variant="ghost"
                     >
                        <Link2 className="size-4" />
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
                           "size-8 rounded",
                           showSidebar && "bg-accent text-accent-foreground",
                        )}
                        onClick={onToggleSidebar}
                        size="icon"
                        type="button"
                        variant="ghost"
                     >
                        <Link2Off className="size-4" />
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
                        className="h-8 gap-2 rounded px-3 text-sm font-medium"
                        type="button"
                        variant="ghost"
                     >
                        <cfg.Icon
                           className={cn("size-3.5 shrink-0", cfg.text)}
                        />
                        <span className={cn(cfg.text)}>{cfg.label}</span>
                        <ChevronDown className="size-3.5 text-muted-foreground" />
                     </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                     {(
                        ["draft", "published", "archived"] as ContentStatus[]
                     ).map((s) => {
                        const item = STATUS_CONFIG[s];
                        return (
                           <DropdownMenuItem
                              className="gap-2.5 text-sm py-2"
                              key={s}
                              onClick={() => onStatusChange(s)}
                           >
                              <item.Icon
                                 className={cn("size-4 shrink-0", item.text)}
                              />
                              <span className={cn("flex-1", item.text)}>
                                 {item.label}
                              </span>
                              {status === s && (
                                 <Check className="size-3.5 text-muted-foreground" />
                              )}
                           </DropdownMenuItem>
                        );
                     })}
                  </DropdownMenuContent>
               </DropdownMenu>
            )}

            <Separator className="h-4 mx-0.5" orientation="vertical" />

            {/* Save */}
            <Button
               className="h-8 gap-2 rounded px-4 text-sm"
               disabled={isSaving}
               onClick={onSave}
               size="sm"
               type="button"
               variant="default"
            >
               {isSaving ? (
                  <Loader2 className="size-4 animate-spin" />
               ) : (
                  <Save className="size-4" />
               )}
               Salvar
            </Button>
         </div>
      </TooltipProvider>
   );
}
