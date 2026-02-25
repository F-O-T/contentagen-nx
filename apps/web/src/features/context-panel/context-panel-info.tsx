import { cn } from "@packages/ui/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function ContextPanelSection({
   title,
   children,
   className,
}: {
   title?: string;
   children: ReactNode;
   className?: string;
}) {
   return (
      <div className={cn("flex flex-col", className)}>
         {title && (
            <div className="bg-muted/50 border-b px-3 py-2 text-xs font-semibold text-foreground">
               {title}
            </div>
         )}
         <div className="flex flex-col py-1">{children}</div>
      </div>
   );
}

export function ContextPanelAction({
   icon: Icon,
   label,
   onClick,
   variant = "default",
}: {
   icon: LucideIcon;
   label: string;
   onClick: () => void;
   variant?: "default" | "destructive";
}) {
   return (
      <button
         className={cn(
            "flex w-full items-center gap-2.5 px-3 py-1.5 text-sm transition-colors hover:bg-accent",
            variant === "destructive" &&
               "text-destructive hover:bg-destructive/10 hover:text-destructive",
         )}
         onClick={onClick}
         type="button"
      >
         <Icon
            className={cn(
               "size-4 shrink-0 text-muted-foreground",
               variant === "destructive" && "text-destructive",
            )}
         />
         {label}
      </button>
   );
}

export function ContextPanelMeta({
   label,
   value,
}: {
   label: string;
   value: ReactNode;
}) {
   return (
      <div className="flex items-center justify-between px-3 py-1.5 text-sm">
         <span className="text-muted-foreground">{label}</span>
         <span className="ml-4 truncate font-medium">{value}</span>
      </div>
   );
}

export function ContextPanelDivider() {
   return <div className="my-1 border-t" />;
}
