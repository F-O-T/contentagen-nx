import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import { Card, CardContent, CardFooter } from "@packages/ui/components/card";
import { Checkbox } from "@packages/ui/components/checkbox";
import {
   Collapsible,
   CollapsibleContent,
   CollapsibleTrigger,
} from "@packages/ui/components/collapsible";
import { cn } from "@packages/ui/lib/utils";
import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import type { DataTableAction } from "../types";

interface DataTableMobileCardProps<TData> {
   /** Main content of the card (description, category, date, value, etc.) */
   children: ReactNode;
   /** Whether the card is expanded */
   isExpanded: boolean;
   /** Toggle expansion callback */
   toggleExpanded: () => void;
   /** Whether the row is selected */
   isSelected?: boolean;
   /** Toggle selection callback */
   toggleSelected?: () => void;
   /** Whether row selection is enabled */
   enableRowSelection?: boolean;
   /** Whether the card can be expanded (has actions) */
   canExpand?: boolean;
   /** The data row for action callbacks */
   row: TData;
   /** Actions to show when expanded */
   actions?: DataTableAction<TData>[];
   /** Optional metadata to show in expanded area (e.g., account info) */
   metadata?: ReactNode;
   className?: string;
}

export function DataTableMobileCard<TData>({
   children,
   isExpanded,
   toggleExpanded,
   isSelected,
   toggleSelected,
   enableRowSelection,
   canExpand = true,
   row,
   actions = [],
   metadata,
   className,
}: DataTableMobileCardProps<TData>) {
   const visibleActions = actions.filter(
      (action) => action.isVisible?.(row) ?? true,
   );

   const hasExpandableContent =
      canExpand && (visibleActions.length > 0 || metadata);

   return (
      <Collapsible onOpenChange={toggleExpanded} open={isExpanded}>
         <Card className={cn(isSelected && "ring-2 ring-primary", className)}>
            <CardContent className="pt-4">
               <div className="flex items-start gap-3">
                  {enableRowSelection && (
                     <Checkbox
                        checked={isSelected}
                        className="mt-1"
                        onCheckedChange={() => toggleSelected?.()}
                        onClick={(e) => e.stopPropagation()}
                     />
                  )}
                  <div className="flex-1 min-w-0">{children}</div>
               </div>
            </CardContent>

            {hasExpandableContent && (
               <CardFooter className="pt-0">
                  <CollapsibleTrigger asChild>
                     <Button className="w-full gap-2" variant="outline">
                        <ChevronDown
                           className={cn(
                              "size-4 transition-transform duration-200",
                              isExpanded && "rotate-180",
                           )}
                        />
                        {"Mais"}
                     </Button>
                  </CollapsibleTrigger>
               </CardFooter>
            )}
         </Card>

         {hasExpandableContent && (
            <CollapsibleContent>
               <Card className="rounded-t-none border-t-0 -mt-px">
                  <CardContent className="pt-4 space-y-3">
                     {metadata && (
                        <div className="flex flex-wrap items-center gap-2">
                           {metadata}
                        </div>
                     )}
                     {visibleActions.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2">
                           {visibleActions.map((action) => {
                              const isDisabled =
                                 action.isDisabled?.(row) ?? false;

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
                  </CardContent>
               </Card>
            </CollapsibleContent>
         )}
      </Collapsible>
   );
}

interface DataTableMobileCardMetadataProps {
   label: string;
   value: string;
   icon?: ReactNode;
}

export function DataTableMobileCardMetadata({
   label,
   value,
   icon,
}: DataTableMobileCardMetadataProps) {
   return (
      <Badge className="gap-1.5" variant="secondary">
         {icon}
         {label}: {value}
      </Badge>
   );
}
