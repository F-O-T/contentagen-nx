"use client";

import { Button } from "@packages/ui/components/button";
import { Input } from "@packages/ui/components/input";
import {
   Tooltip,
   TooltipContent,
   TooltipProvider,
   TooltipTrigger,
} from "@packages/ui/components/tooltip";
import {
   FloatingLinkUrlInput,
   LinkOpenButton,
   useFloatingLinkEdit,
   useFloatingLinkEditState,
   useFloatingLinkEnter,
   useFloatingLinkEscape,
   useFloatingLinkInsert,
   useFloatingLinkInsertState,
} from "@platejs/link/react";
import { ExternalLink, Link2Off } from "lucide-react";
import type { CSSProperties } from "react";

/**
 * Clamps the floating toolbar's `left` position so it never overflows
 * the right edge of the viewport. Plate.js/floating-ui computes absolute
 * coordinates without knowing the rendered width, so we correct it here.
 */
function clampStyle(
   style: CSSProperties | undefined,
   reservedWidth = 344,
): CSSProperties | undefined {
   if (typeof window === "undefined" || !style) return style;
   const raw = style.left;
   const left =
      typeof raw === "number"
         ? raw
         : typeof raw === "string"
           ? parseFloat(raw)
           : Number.NaN;
   if (Number.isNaN(left)) return style;
   const max = window.innerWidth - reservedWidth - 8;
   return { ...style, left: Math.max(0, Math.min(left, max)) };
}

function InsertLinkToolbar() {
   useFloatingLinkEnter();
   useFloatingLinkEscape();

   const insertState = useFloatingLinkInsertState();
   const {
      hidden,
      props: floatingProps,
      ref,
   } = useFloatingLinkInsert(insertState);

   if (hidden) return null;

   return (
      <div
         className="flex w-80 items-center gap-1 rounded-md border bg-popover p-1 shadow-md z-50"
         ref={ref}
         style={clampStyle(floatingProps.style)}
      >
         <FloatingLinkUrlInput asChild>
            <Input
               className="h-8 flex-1 border-none bg-transparent px-2 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
               placeholder="Insira a URL..."
            />
         </FloatingLinkUrlInput>
      </div>
   );
}

function EditLinkToolbar() {
   useFloatingLinkEnter();
   useFloatingLinkEscape();

   const editState = useFloatingLinkEditState();
   const {
      editButtonProps,
      props: floatingProps,
      ref,
      unlinkButtonProps,
   } = useFloatingLinkEdit(editState);

   const { isEditing, isOpen } = editState;

   if (!isOpen) return null;

   return (
      <div
         className="flex w-80 items-center gap-1 rounded-md border bg-popover p-1 shadow-md z-50"
         ref={ref}
         style={clampStyle(floatingProps.style)}
      >
         {isEditing ? (
            <FloatingLinkUrlInput asChild>
               <Input
                  className="h-8 flex-1 border-none bg-transparent px-2 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                  placeholder="Editar URL..."
               />
            </FloatingLinkUrlInput>
         ) : (
            <>
               <Button
                  className="h-8 flex-1 justify-start truncate px-2 text-sm font-normal"
                  size="sm"
                  variant="ghost"
                  {...editButtonProps}
               >
                  Editar link
               </Button>

               <Tooltip>
                  <TooltipTrigger asChild>
                     <LinkOpenButton
                        aria-label="Abrir link em nova aba"
                        className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                     >
                        <ExternalLink className="size-4" />
                     </LinkOpenButton>
                  </TooltipTrigger>
                  <TooltipContent>Abrir em nova aba</TooltipContent>
               </Tooltip>

               <Tooltip>
                  <TooltipTrigger asChild>
                     <Button
                        className="size-8 shrink-0"
                        size="icon"
                        variant="ghost"
                        {...unlinkButtonProps}
                     >
                        <Link2Off className="size-4" />
                     </Button>
                  </TooltipTrigger>
                  <TooltipContent>Remover link</TooltipContent>
               </Tooltip>
            </>
         )}
      </div>
   );
}

export function LinkFloatingToolbar() {
   return (
      <TooltipProvider>
         <InsertLinkToolbar />
         <EditLinkToolbar />
      </TooltipProvider>
   );
}
