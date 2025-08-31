import { useState, useMemo } from "react";
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
   Filter,
   Archive,
   PlusIcon,
} from "lucide-react";
import { FilteringCredenza } from "../features/filtering-credenza";
import { BulkActionsCredenza } from "../features/bulk-actions-credenza";
import { CreateContentCredenza } from "../features/create-content-credenza";
import type { RouterInput, RouterOutput } from "@packages/api/client";

type Statuses = RouterInput["content"]["listAllContent"]["status"];
interface ContentListToolbarProps {
   page: number;
   totalPages: number;
   onPageChange: (page: number) => void;
   onSelectAll?: () => void;
   selectedItemsCount?: number;
   allSelected?: boolean;
   selectedStatuses: Statuses;
   selectedAgents: string[];
   onStatusesChange: (statuses: Statuses) => void;
   onAgentsChange: (agents: string[]) => void;
   agents: RouterOutput["agent"]["list"];
   selectedItems: Set<string>;
}

export function ContentListToolbar({
   page,
   totalPages,
   onPageChange,
   onSelectAll,
   selectedItemsCount = 0,
   allSelected = false,
   selectedStatuses,
   selectedAgents,
   onStatusesChange,
   onAgentsChange,
   agents,
   selectedItems,
}: ContentListToolbarProps) {
   const [openFilter, setOpenFilter] = useState(false);
   const [openBulk, setOpenBulk] = useState(false);
   const [openNewContent, setOpenNewContent] = useState(false);
   const actions = useMemo(
      () => [
         {
            label: allSelected ? "Unselect All" : "Select All",
            icon: CheckSquare,
            onClick: onSelectAll,
         },
         {
            label: "Filtering",
            icon: Filter,
            onClick: () => setOpenFilter(true),
         },
         {
            label: "New content",
            icon: PlusIcon,
            onClick: () => setOpenNewContent(true),
         },
         {
            label: "Bulk Actions",
            icon: Archive,
            onClick: () => setOpenBulk(true),
            disabled: selectedItemsCount === 0,
         },
      ],
      [onSelectAll, selectedItemsCount, allSelected],
   );

   return (
      <>
         <div className="flex items-center justify-between gap-4 p-4 bg-background border rounded-lg shadow-sm">
            <div className="flex items-center gap-2">
               <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onPageChange(page - 1)}
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
                  onClick={() => onPageChange(page + 1)}
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
                        disabled={action.disabled}
                        className="flex gap-2"
                     >
                        <action.icon className="h-4 w-4" />
                        {action.label}
                     </DropdownMenuItem>
                  ))}
               </DropdownMenuContent>
            </DropdownMenu>
         </div>
         <CreateContentCredenza
            onOpenChange={setOpenNewContent}
            open={openNewContent}
         />
         <FilteringCredenza
            open={openFilter}
            onOpenChange={setOpenFilter}
            selectedStatuses={selectedStatuses}
            selectedAgents={selectedAgents}
            onStatusesChange={onStatusesChange}
            onAgentsChange={onAgentsChange}
            agents={agents}
         />
         <BulkActionsCredenza
            open={openBulk}
            onOpenChange={setOpenBulk}
            selectedItems={Array.from(selectedItems)}
         />
      </>
   );
}
