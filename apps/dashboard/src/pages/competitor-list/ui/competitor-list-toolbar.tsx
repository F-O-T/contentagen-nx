import React, { useState, useMemo } from "react";
import { Button } from "@packages/ui/components/button";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
} from "@packages/ui/components/dropdown-menu";
import { translate } from "@packages/localization";
import {
   ChevronLeft,
   ChevronRight,
   MoreVertical,
   CheckSquare,
   PlusIcon,
} from "lucide-react";
import { CreateEditCompetitorDialog } from "../features/create-edit-competitor-dialog";
import { useCompetitorList } from "../lib/competitor-list-context";

export function CompetitorListToolbar() {
   const {
      page,
      totalPages,
      handlePageChange,
      handleSelectAll,
      selectedItemsCount,
      allSelectableSelected,
   } = useCompetitorList();

   const [showCreateDialog, setShowCreateDialog] = useState(false);

   const actions = useMemo(
      () => [
         {
            label: allSelectableSelected
               ? translate("pages.competitor-list.toolbar.unselect-all")
               : translate("pages.competitor-list.toolbar.select-all"),
            icon: CheckSquare,
            onClick: handleSelectAll,
         },
         {
            label: translate("pages.competitor-list.toolbar.new-competitor"),
            icon: PlusIcon,
            onClick: () => setShowCreateDialog(true),
         },
      ],
      [handleSelectAll, allSelectableSelected],
   );

   return (
      <>
         {/* Toolbar with Pagination */}
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
                  {page} {translate("pages.competitor-list.toolbar.of")}{" "}
                  {totalPages}
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

            {selectedItemsCount > 0 && (
               <span className="text-sm text-muted-foreground">
                  {translate("pages.competitor-list.toolbar.selected-count", {
                     count: selectedItemsCount,
                  })}
               </span>
            )}

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
                        {action.icon &&
                           React.createElement(action.icon, {
                              className: "h-4 w-4",
                           })}
                        {action.label}
                     </DropdownMenuItem>
                  ))}
               </DropdownMenuContent>
            </DropdownMenu>
         </div>

         <CreateEditCompetitorDialog
            open={showCreateDialog}
            onOpenChange={setShowCreateDialog}
         />
      </>
   );
}
