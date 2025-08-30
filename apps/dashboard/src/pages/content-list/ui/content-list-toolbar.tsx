import { Button } from "@packages/ui/components/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ContentListToolbarProps {
   page: number;
   totalPages: number;
   onPageChange: (page: number) => void;
}

export function ContentListToolbar({
   page,
   totalPages,
   onPageChange,
}: ContentListToolbarProps) {
   // Fetch profile photos for all agents at the top level

   return (
      <div className="flex items-center justify-between gap-4 p-4 bg-background border rounded-lg shadow-sm">
         {/* Center - Pagination */}
         <div className="flex items-center gap-2">
            <Button
               variant="outline"
               size="icon"
               onClick={() => onPageChange(page - 1)}
               disabled={page === 1}
               className="h-8 w-8"
            >
               <ChevronLeft className="h-4 w-4" />
            </Button>

            <span className="text-sm text-muted-foreground px-2">
               {page} of {totalPages}
            </span>

            <Button
               variant="outline"
               size="icon"
               onClick={() => onPageChange(page + 1)}
               disabled={page === totalPages}
               className="h-8 w-8"
            >
               <ChevronRight className="h-4 w-4" />
            </Button>
         </div>
      </div>
   );
}
