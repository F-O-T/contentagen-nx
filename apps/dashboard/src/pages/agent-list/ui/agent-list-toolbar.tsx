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
   PlusIcon,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useAgentList } from "../lib/agent-list-context";

export function AgentListToolbar() {
   const { page, totalPages, handlePageChange, handleSelectAll, allSelected } =
      useAgentList();

   const actions = useMemo(
      () => [
         {
            label: allSelected ? "Unselect All" : "Select All",
            icon: CheckSquare,
            onClick: handleSelectAll,
         },
         {
            label: "Create new agent",
            icon: PlusIcon,
            onClick: () => {
               // This will be handled by the Link component
            },
            href: "/agents/manual",
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
                     asChild={!!action.href}
                  >
                     {action.href ? (
                        <Link to={action.href}>
                           <action.icon className="h-4 w-4" />
                           {action.label}
                        </Link>
                     ) : (
                        <>
                           <action.icon className="h-4 w-4" />
                           {action.label}
                        </>
                     )}
                  </DropdownMenuItem>
               ))}
            </DropdownMenuContent>
         </DropdownMenu>
      </div>
   );
}
