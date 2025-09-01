import { useMemo } from "react";
import { Button } from "@packages/ui/components/button";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
} from "@packages/ui/components/dropdown-menu";
import {
   ChevronLeft,
   ChevronRight,
   MoreVertical,
   CheckSquare,
} from "lucide-react";

import { useIdeasList } from "../lib/ideas-list-context";

export function IdeasListToolbar() {
   const { page, totalPages, handlePageChange, handleSelectAll, allSelected } =
      useIdeasList();

   const actions = useMemo(
      () => [
         {
            label: allSelected ? "Unselect All" : "Select All",
            icon: CheckSquare,
            onClick: handleSelectAll,
         },
      ],
      [handleSelectAll, allSelected],
   );

   return (
      <div className="flex items-center justify-between gap-4 p-4 bg-background border rounded-lg shadow-sm">
         <div className="flex items-center gap-2">
            <Button
               variant="outline"
               size="icon"
               onClick={() => handlePageChange(page - 1)}
               disabled={page === 1}
            >
               <ChevronLeft className="h-4 w-4" />
            </Button>

            <span className="text-sm text-muted-foreground px-2">
               {page} of {totalPages}
            </span>

            <Button
               variant="outline"
               size="icon"
               onClick={() => handlePageChange(page + 1)}
               disabled={page === totalPages}
            >
               <ChevronRight className="h-4 w-4" />
            </Button>
         </div>
         <DropdownMenu>
            <DropdownMenuTrigger asChild>
               <Button variant="outline" size="icon">
                  <MoreVertical className="h-4 w-4" />
               </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
               {actions.map((action) => (
                  <DropdownMenuItem
                     key={action.label}
                     onClick={action.onClick}
                     className="flex gap-2"
                  >
                     <action.icon className="h-4 w-4" />
                     {action.label}
                  </DropdownMenuItem>
               ))}
            </DropdownMenuContent>
         </DropdownMenu>
      </div>
   );
}
