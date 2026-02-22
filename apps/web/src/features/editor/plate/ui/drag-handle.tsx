"use client";

import { cn } from "@packages/ui/lib/utils";
import { useDraggable, useDropLine } from "@platejs/dnd";
import { GripVertical } from "lucide-react";
import type { TElement } from "platejs";
import type { ReactNode } from "react";

interface DragHandleProps {
   element: TElement;
   children: ReactNode;
   className?: string;
}

export function DragHandle({ element, children, className }: DragHandleProps) {
   const { isDragging, handleRef, nodeRef, previewRef } = useDraggable({
      element,
      type: element.type,
   });

   const { dropLine } = useDropLine({ id: element.id as string });

   const composedRef = (node: HTMLDivElement | null) => {
      if (typeof previewRef === "function")
         (previewRef as (n: HTMLDivElement | null) => void)(node);
      else if (previewRef)
         (previewRef as React.MutableRefObject<HTMLDivElement | null>).current =
            node;
      if (typeof nodeRef === "function")
         (nodeRef as (n: HTMLDivElement | null) => void)(node);
      else if (nodeRef)
         (nodeRef as React.MutableRefObject<HTMLDivElement | null>).current =
            node;
   };

   return (
      <div
         className={cn("relative group", isDragging && "opacity-50", className)}
         ref={composedRef}
      >
         {/* Drop line indicator */}
         {dropLine && (
            <div
               className={cn(
                  "absolute z-50 h-0.5 w-full bg-primary/40 rounded-full",
                  dropLine === "top" ? "-top-px" : "-bottom-px",
               )}
            />
         )}

         {/* Drag handle — visible on hover */}
         <div
            className="absolute -left-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
            ref={handleRef}
         >
            <GripVertical className="size-4 text-muted-foreground" />
         </div>

         {children}
      </div>
   );
}
