import { Button } from "@packages/ui/components/button";
import {
   type TimePeriod,
   TimePeriodChips,
   type TimePeriodDateRange,
} from "@packages/ui/components/time-period-chips";
import { cn } from "@packages/ui/lib/utils";
import { X } from "lucide-react";
import type { ReactNode } from "react";

interface DataTableHeaderFiltersProps {
   /** Date filter using existing TimePeriodChips */
   dateFilter?: TimePeriod | null;
   onDateFilterChange?: (
      value: TimePeriod | null,
      dateRange: TimePeriodDateRange,
   ) => void;
   /** Additional filter chips (e.g., type filters) */
   additionalFilters?: ReactNode;
   /** Show clear button */
   hasActiveFilters?: boolean;
   onClearFilters?: () => void;
   className?: string;
}

export function DataTableHeaderFilters({
   dateFilter,
   onDateFilterChange,
   additionalFilters,
   hasActiveFilters,
   onClearFilters,
   className,
}: DataTableHeaderFiltersProps) {
   return (
      <div className={cn("flex flex-wrap items-center gap-4", className)}>
         {onDateFilterChange && (
            <TimePeriodChips
               onValueChange={onDateFilterChange}
               scrollable
               size="sm"
               value={dateFilter ?? null}
            />
         )}

         {additionalFilters}

         {hasActiveFilters && onClearFilters && (
            <Button
               className="h-7 shrink-0"
               onClick={onClearFilters}
               size="sm"
               variant="ghost"
            >
               <X className="size-3.5 mr-1" />
               {"Limpar filtros"}
            </Button>
         )}
      </div>
   );
}
