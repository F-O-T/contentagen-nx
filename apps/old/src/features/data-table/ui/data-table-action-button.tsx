import { Button } from "@packages/ui/components/button";
import {
   Tooltip,
   TooltipContent,
   TooltipTrigger,
} from "@packages/ui/components/tooltip";
import { cn } from "@packages/ui/lib/utils";
import type { ReactNode } from "react";

interface DataTableActionButtonProps
   extends Omit<React.ComponentProps<typeof Button>, "children"> {
   icon: ReactNode;
   label: string;
   tooltip?: string;
   showLabel?: boolean;
}

export function DataTableActionButton({
   icon,
   label,
   tooltip,
   showLabel = true,
   className,
   variant = "outline",
   size = "sm",
   ...props
}: DataTableActionButtonProps) {
   const button = (
      <Button
         className={cn("gap-1.5", className)}
         size={size}
         variant={variant}
         {...props}
      >
         {icon}
         {showLabel && <span>{label}</span>}
      </Button>
   );

   if (tooltip) {
      return (
         <Tooltip>
            <TooltipTrigger asChild>{button}</TooltipTrigger>
            <TooltipContent>{tooltip}</TooltipContent>
         </Tooltip>
      );
   }

   return button;
}
