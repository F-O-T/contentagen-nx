import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import { Separator } from "@packages/ui/components/separator";
import { cn } from "@packages/ui/lib/utils";
import type { DataTableAction } from "../types";

interface DataTableExpandedActionsProps<TData> {
   row: TData;
   actions: DataTableAction<TData>[];
   /** Optional metadata to show above actions (e.g., account info) */
   metadata?: React.ReactNode;
   className?: string;
}

export function DataTableExpandedActions<TData>({
   row,
   actions,
   metadata,
   className,
}: DataTableExpandedActionsProps<TData>) {
   const visibleActions = actions.filter(
      (action) => action.isVisible?.(row) ?? true,
   );

   if (visibleActions.length === 0 && !metadata) {
      return null;
   }

   return (
      <div className={cn("p-4 space-y-3", className)}>
         {metadata && (
            <div className="flex flex-wrap items-center gap-2">{metadata}</div>
         )}
         {metadata && visibleActions.length > 0 && <Separator />}
         {visibleActions.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
               {visibleActions.map((action) => {
                  const isDisabled = action.isDisabled?.(row) ?? false;

                  return (
                     <Button
                        className={cn(
                           "gap-1.5",
                           action.variant === "destructive" &&
                              "border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20",
                        )}
                        disabled={isDisabled}
                        key={action.id}
                        onClick={(e) => {
                           e.stopPropagation();
                           action.onClick(row);
                        }}
                        size="sm"
                        variant={
                           action.variant === "destructive"
                              ? "destructive"
                              : "outline"
                        }
                     >
                        {action.icon}
                        {action.label}
                     </Button>
                  );
               })}
            </div>
         )}
      </div>
   );
}

interface DataTableExpandedMetadataProps {
   label: string;
   value: string;
   icon?: React.ReactNode;
}

export function DataTableExpandedMetadata({
   label,
   value,
   icon,
}: DataTableExpandedMetadataProps) {
   return (
      <Badge className="gap-1.5" variant="secondary">
         {icon}
         {label}: {value}
      </Badge>
   );
}
