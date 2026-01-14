"use client";

import { Toggle } from "@packages/ui/components/toggle";
import {
   Tooltip,
   TooltipContent,
   TooltipTrigger,
} from "@packages/ui/components/tooltip";
import { cn } from "@packages/ui/lib/utils";
import {
   Bold,
   Code,
   Italic,
   Link,
   Sparkles,
   Strikethrough,
   Underline,
} from "lucide-react";
import { createPortal } from "react-dom";

export type TextFormatType =
   | "bold"
   | "italic"
   | "strikethrough"
   | "underline"
   | "code";

interface FloatingTextFormatToolbarProps {
   position: { top: number; left: number };
   isVisible: boolean;
   activeFormats: Set<TextFormatType>;
   isLink: boolean;
   onFormat: (format: TextFormatType) => void;
   onToggleLink: () => void;
   onAIEdit: () => void;
   containerRef?: React.RefObject<HTMLDivElement | null>;
   showAIEdit?: boolean;
}

/**
 * Floating toolbar that appears when text is selected.
 * Provides quick access to text formatting options.
 * Rendered in a portal to prevent z-index stacking context issues.
 */
export function FloatingTextFormatToolbar({
   position,
   isVisible,
   activeFormats,
   isLink,
   onFormat,
   onToggleLink,
   onAIEdit,
   containerRef,
   showAIEdit = true,
}: FloatingTextFormatToolbarProps) {
   if (!isVisible) return null;

   const formatButtons: {
      format: TextFormatType;
      icon: typeof Bold;
      label: string;
      shortcut: string;
   }[] = [
      { format: "bold", icon: Bold, label: "Negrito", shortcut: "Ctrl+B" },
      { format: "italic", icon: Italic, label: "Itálico", shortcut: "Ctrl+I" },
      {
         format: "strikethrough",
         icon: Strikethrough,
         label: "Tachado",
         shortcut: "",
      },
      {
         format: "underline",
         icon: Underline,
         label: "Sublinhado",
         shortcut: "Ctrl+U",
      },
      { format: "code", icon: Code, label: "Código", shortcut: "" },
   ];

   // Calculate absolute position based on container
   const containerRect = containerRef?.current?.getBoundingClientRect();
   const absoluteTop = (containerRect?.top ?? 0) + position.top - 44;
   const absoluteLeft = (containerRect?.left ?? 0) + position.left;

   const toolbar = (
      <div
         className={cn(
            "fixed z-[9999] flex items-center gap-0.5 rounded-lg border bg-popover/95 p-1 shadow-lg backdrop-blur-sm",
            "animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2",
            "duration-150",
         )}
         onMouseDown={(e) => e.preventDefault()}
         style={{
            top: absoluteTop,
            left: absoluteLeft,
            transform: "translateX(-50%)",
         }}
      >
         {formatButtons.map(({ format, icon: Icon, label, shortcut }) => (
            <Tooltip key={format}>
               <TooltipTrigger asChild>
                  <Toggle
                     aria-label={label}
                     className="h-8 w-8 p-0"
                     onPressedChange={() => onFormat(format)}
                     pressed={activeFormats.has(format)}
                     size="sm"
                  >
                     <Icon className="h-4 w-4" />
                  </Toggle>
               </TooltipTrigger>
               <TooltipContent className="text-xs" side="top">
                  {label}
                  {shortcut && (
                     <kbd className="ml-1 rounded border bg-background px-1 py-0.5 font-mono text-[10px]">
                        {shortcut}
                     </kbd>
                  )}
               </TooltipContent>
            </Tooltip>
         ))}

         {/* Divider */}
         <div className="mx-1 h-5 w-px bg-border" />

         {/* Link button */}
         <Tooltip>
            <TooltipTrigger asChild>
               <Toggle
                  aria-label="Link"
                  className="h-8 w-8 p-0"
                  onPressedChange={onToggleLink}
                  pressed={isLink}
                  size="sm"
               >
                  <Link className="h-4 w-4" />
               </Toggle>
            </TooltipTrigger>
            <TooltipContent className="text-xs" side="top">
               Link
            </TooltipContent>
         </Tooltip>

         {/* AI Edit button - only show if user has access */}
         {showAIEdit && (
            <>
               {/* Divider */}
               <div className="mx-1 h-5 w-px bg-border" />

               <Tooltip>
                  <TooltipTrigger asChild>
                     <button
                        className="flex h-8 items-center gap-1.5 rounded-md px-2 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                        onClick={onAIEdit}
                        type="button"
                     >
                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                        <span className="font-medium">Editar com IA</span>
                     </button>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs" side="top">
                     Editar com IA
                     <kbd className="ml-1 rounded border bg-background px-1 py-0.5 font-mono text-[10px]">
                        Ctrl+K
                     </kbd>
                  </TooltipContent>
               </Tooltip>
            </>
         )}
      </div>
   );

   return createPortal(toolbar, document.body);
}
