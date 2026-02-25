"use client";

import { Button } from "@packages/ui/components/button";
import {
   Tooltip,
   TooltipContent,
   TooltipTrigger,
} from "@packages/ui/components/tooltip";
import { cn } from "@packages/ui/lib/utils";
import { Slot } from "radix-ui";
import { type ComponentPropsWithRef, forwardRef } from "react";

export type TooltipIconButtonProps = ComponentPropsWithRef<typeof Button> & {
   tooltip: string;
   side?: "top" | "bottom" | "left" | "right";
};

export const TooltipIconButton = forwardRef<
   HTMLButtonElement,
   TooltipIconButtonProps
>(({ children, tooltip, side = "bottom", className, ...rest }, ref) => {
   return (
      <Tooltip>
         <TooltipTrigger asChild>
            <Button
               size="icon"
               variant="ghost"
               {...rest}
               className={cn("aui-button-icon size-6 p-1", className)}
               ref={ref}
            >
               <Slot.Slottable>{children}</Slot.Slottable>
               <span className="aui-sr-only sr-only">{tooltip}</span>
            </Button>
         </TooltipTrigger>
         <TooltipContent side={side}>{tooltip}</TooltipContent>
      </Tooltip>
   );
});

TooltipIconButton.displayName = "TooltipIconButton";
