import {
   ToggleGroup,
   ToggleGroupItem,
} from "@packages/ui/components/toggle-group";
import { cn } from "@packages/ui/lib/utils";
import type { DataTableFilterChip } from "../types";

interface DataTableTypeFilterChipsProps<TValue extends string = string> {
   value: TValue | null;
   onValueChange: (value: TValue | null) => void;
   chips: DataTableFilterChip<TValue>[];
   className?: string;
   size?: "sm" | "default" | "lg";
}

export function DataTableTypeFilterChips<TValue extends string = string>({
   value,
   onValueChange,
   chips,
   className,
   size = "sm",
}: DataTableTypeFilterChipsProps<TValue>) {
   const handleValueChange = (newValue: string) => {
      onValueChange(newValue ? (newValue as TValue) : null);
   };

   return (
      <ToggleGroup
         className={cn("justify-start", className)}
         onValueChange={handleValueChange}
         size={size}
         spacing={2}
         type="single"
         value={value || ""}
         variant="outline"
      >
         {chips.map((chip) => (
            <ToggleGroupItem
               aria-label={`Filter by ${chip.label}`}
               className={cn(
                  "gap-1.5 shrink-0 data-[state=on]:bg-transparent data-[state=on]:text-primary",
                  size === "sm" && "text-xs px-2 h-7",
               )}
               key={chip.id}
               value={chip.value}
            >
               {chip.icon}
               <span className="hidden sm:inline">{chip.label}</span>
               {chip.shortLabel && (
                  <span className="sm:hidden">{chip.shortLabel}</span>
               )}
            </ToggleGroupItem>
         ))}
      </ToggleGroup>
   );
}
