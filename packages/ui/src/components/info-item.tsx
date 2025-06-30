import { cn } from "@packages/ui/lib/utils";
import { ReactNode } from "react";

export interface InfoItemProps {
   icon: ReactNode;
   label: string;
   value: string;
   className?: string;
}

export function InfoItem({ icon, label, value, className }: InfoItemProps) {
   return (
      <div className="flex flex-col items-start gap-1 p-2 bg-muted rounded-md w-full">
         <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
            {icon}
            <span>{label}</span>
         </div>
         <span
            className={cn(
               "text-sm font-semibold text-foreground capitalize truncate w-full",
               className,
            )}
            title={value}
         >
            {value}
         </span>
      </div>
   );
}

