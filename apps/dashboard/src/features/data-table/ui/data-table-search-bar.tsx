import { Button } from "@packages/ui/components/button";
import {
   InputGroup,
   InputGroupAddon,
   InputGroupInput,
} from "@packages/ui/components/input-group";
import { cn } from "@packages/ui/lib/utils";
import { Search, X } from "lucide-react";
import type { ReactNode } from "react";

interface DataTableSearchBarProps {
   value: string;
   onChange: (value: string) => void;
   placeholder?: string;
   /** Additional elements to render on the right side */
   trailing?: ReactNode;
   /** Show clear button when has active filters */
   hasActiveFilters?: boolean;
   onClearFilters?: () => void;
   className?: string;
}

export function DataTableSearchBar({
   value,
   onChange,
   placeholder = "Buscar...",
   trailing,
   hasActiveFilters = false,
   onClearFilters,
   className,
}: DataTableSearchBarProps) {
   return (
      <div
         className={cn(
            "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
            className,
         )}
      >
         <InputGroup className="sm:max-w-md flex-1">
            <InputGroupInput
               onChange={(e) => onChange(e.target.value)}
               placeholder={placeholder}
               value={value}
            />
            <InputGroupAddon>
               <Search />
            </InputGroupAddon>
         </InputGroup>

         <div className="flex items-center gap-2">
            {trailing}
            {hasActiveFilters && onClearFilters && (
               <Button
                  className="h-8 shrink-0"
                  onClick={onClearFilters}
                  size="sm"
                  variant="ghost"
               >
                  <X className="size-4 mr-1" />
                  {"Limpar filtros"}
               </Button>
            )}
         </div>
      </div>
   );
}
