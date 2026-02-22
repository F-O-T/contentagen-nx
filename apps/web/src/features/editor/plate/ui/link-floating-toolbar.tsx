"use client";

import { Button } from "@packages/ui/components/button";
import { Input } from "@packages/ui/components/input";
import {
   Tooltip,
   TooltipContent,
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

function InsertLinkToolbar() {
   useFloatingLinkEnter();
   useFloatingLinkEscape();

   const insertState = useFloatingLinkInsertState();
   const { hidden, props: floatingProps, ref } =
      useFloatingLinkInsert(insertState);

   if (hidden) return null;

   return (
      <div
         ref={ref}
         className="flex w-[330px] items-center gap-1 rounded-md border bg-popover p-1 shadow-md"
         style={floatingProps.style}
      >
         <FloatingLinkUrlInput asChild>
            <Input
               className="h-7 flex-1 border-none bg-transparent px-2 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
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
   const { editButtonProps, props: floatingProps, ref, unlinkButtonProps } =
      useFloatingLinkEdit(editState);

   const { isEditing, isOpen } = editState;

   if (!isOpen) return null;

   return (
      <div
         ref={ref}
         className="flex w-[330px] items-center gap-1 rounded-md border bg-popover p-1 shadow-md"
         style={floatingProps.style}
      >
         {isEditing ? (
            <FloatingLinkUrlInput asChild>
               <Input
                  className="h-7 flex-1 border-none bg-transparent px-2 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                  placeholder="Editar URL..."
               />
            </FloatingLinkUrlInput>
         ) : (
            <>
               <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 flex-1 justify-start truncate px-2 text-sm font-normal"
                  {...editButtonProps}
               >
                  Editar link
               </Button>

               <Tooltip>
                  <TooltipTrigger asChild>
                     <LinkOpenButton className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50">
                        <ExternalLink className="size-4" />
                     </LinkOpenButton>
                  </TooltipTrigger>
                  <TooltipContent>Abrir em nova aba</TooltipContent>
               </Tooltip>

               <Tooltip>
                  <TooltipTrigger asChild>
                     <Button
                        size="icon"
                        variant="ghost"
                        className="size-7 shrink-0"
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
      <>
         <InsertLinkToolbar />
         <EditLinkToolbar />
      </>
   );
}
