import { Button } from "@packages/ui/components/button";
import { Label } from "@packages/ui/components/label";
import {
   ChevronLeft,
   ChevronRight,
   Filter,
   Settings,
   CheckSquare,
   Square,
   Trash2,
   Check,
} from "lucide-react";
import { Checkbox } from "@packages/ui/components/checkbox";
import {
   Credenza,
   CredenzaContent,
   CredenzaHeader,
   CredenzaTitle,
} from "@packages/ui/components/credenza";
import {
   DropdownMenu,
   DropdownMenuTrigger,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuSeparator,
   DropdownMenuLabel,
} from "@packages/ui/components/dropdown-menu";
import { Separator } from "@packages/ui/components/separator";
import { useState } from "react";

interface ContentListToolbarProps {
   page: number;
   totalPages: number;
   limit: number;
   onPageChange: (page: number) => void;
   onLimitChange: (limit: number) => void;
   selectedStatuses: string[];
   selectedAgents: string[];
   onStatusFilterChange: (statuses: string[]) => void;
   onAgentFilterChange: (agents: string[]) => void;
   availableAgents: { id: string; name: string }[];
   selectedItems: string[];
   totalItems: number;
   onSelectAll: () => void;
   onBulkApprove: () => void;
   onBulkDelete: () => void;
}

const statusOptions = [
   { value: "draft", label: "Draft" },
   { value: "approved", label: "Approved" },
   { value: "pending", label: "Pending" },
   { value: "planning", label: "Planning" },
   { value: "researching", label: "Researching" },
   { value: "writing", label: "Writing" },
   { value: "editing", label: "Editing" },
   { value: "analyzing", label: "Analyzing" },
   { value: "grammar_checking", label: "Grammar Checking" },
];

const limitOptions = [4, 8, 12, 16, 20];

export function ContentListToolbar({
   page,
   totalPages,
   limit,
   onPageChange,
   onLimitChange,
   selectedStatuses,
   selectedAgents,
   onStatusFilterChange,
   onAgentFilterChange,
   availableAgents,
   selectedItems,
   totalItems,
   onSelectAll,
   onBulkApprove,
   onBulkDelete,
}: ContentListToolbarProps) {
   const [isFilterOpen, setIsFilterOpen] = useState(false);

   const handleStatusChange = (status: string, checked: boolean) => {
      if (checked) {
         onStatusFilterChange([...selectedStatuses, status]);
      } else {
         onStatusFilterChange(selectedStatuses.filter((s) => s !== status));
      }
   };

   const handleAgentChange = (agentId: string, checked: boolean) => {
      if (checked) {
         onAgentFilterChange([...selectedAgents, agentId]);
      } else {
         onAgentFilterChange(selectedAgents.filter((id) => id !== agentId));
      }
   };

   const clearFilters = () => {
      onStatusFilterChange([]);
      onAgentFilterChange([]);
   };

   const hasActiveFilters =
      selectedStatuses.length > 0 || selectedAgents.length > 0;

   const isAllSelected = selectedItems.length === totalItems && totalItems > 0;
   const hasSelections = selectedItems.length > 0;

   return (
      <div className="flex items-center justify-between gap-4 p-4 bg-background border rounded-lg shadow-sm">
         {/* Left side - Actions dropdown */}
         <div className="flex items-center gap-2">
            <DropdownMenu>
               <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                     <Settings className="h-4 w-4" />
                     Actions
                  </Button>
               </DropdownMenuTrigger>
               <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel>Filtering</DropdownMenuLabel>
                  <DropdownMenuItem
                     onClick={() => setIsFilterOpen(true)}
                     className="gap-2"
                  >
                     <Filter className="h-4 w-4" />
                     Filter Content
                     {hasActiveFilters && (
                        <span className="ml-auto bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
                           {selectedStatuses.length + selectedAgents.length}
                        </span>
                     )}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onSelectAll} className="gap-2">
                     {isAllSelected ? (
                        <CheckSquare className="h-4 w-4" />
                     ) : (
                        <Square className="h-4 w-4" />
                     )}
                     Select All ({totalItems})
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuLabel>Bulk Actions</DropdownMenuLabel>
                  <DropdownMenuItem
                     onClick={onBulkApprove}
                     disabled={!hasSelections}
                     className="gap-2"
                  >
                     <Check className="h-4 w-4" />
                     Approve Selected ({selectedItems.length})
                  </DropdownMenuItem>
                  <DropdownMenuItem
                     onClick={onBulkDelete}
                     disabled={!hasSelections}
                     className="gap-2 text-destructive focus:text-destructive"
                  >
                     <Trash2 className="h-4 w-4" />
                     Delete Selected ({selectedItems.length})
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuLabel>Page Size</DropdownMenuLabel>
                  {limitOptions.map((option) => (
                     <DropdownMenuItem
                        key={option}
                        onClick={() => onLimitChange(option)}
                        className={limit === option ? "bg-accent" : ""}
                     >
                        Show {option} items
                     </DropdownMenuItem>
                  ))}
               </DropdownMenuContent>
            </DropdownMenu>

            {/* Filter Credenza */}
            <Credenza open={isFilterOpen} onOpenChange={setIsFilterOpen}>
               <CredenzaContent className="sm:max-w-md">
                  <CredenzaHeader>
                     <CredenzaTitle>Filter Content</CredenzaTitle>
                  </CredenzaHeader>
                  <div className="space-y-6 py-4">
                     {/* Status Filter */}
                     <div className="space-y-3">
                        <h4 className="text-sm font-medium">Status</h4>
                        <div className="grid grid-cols-2 gap-3">
                           {statusOptions.map((status) => (
                              <div
                                 key={status.value}
                                 className="flex items-center space-x-2"
                              >
                                 <Checkbox
                                    id={`status-${status.value}`}
                                    checked={selectedStatuses.includes(
                                       status.value,
                                    )}
                                    onCheckedChange={(checked) =>
                                       handleStatusChange(
                                          status.value,
                                          checked as boolean,
                                       )
                                    }
                                 />
                                 <Label
                                    htmlFor={`status-${status.value}`}
                                    className="text-sm font-normal cursor-pointer"
                                 >
                                    {status.label}
                                 </Label>
                              </div>
                           ))}
                        </div>
                     </div>

                     <Separator />

                     {/* Agent Filter */}
                     <div className="space-y-3">
                        <h4 className="text-sm font-medium">Agent</h4>
                        <div className="space-y-3 max-h-48 overflow-y-auto">
                           {availableAgents.map((agent) => (
                              <div
                                 key={agent.id}
                                 className="flex items-center space-x-2"
                              >
                                 <Checkbox
                                    id={`agent-${agent.id}`}
                                    checked={selectedAgents.includes(agent.id)}
                                    onCheckedChange={(checked) =>
                                       handleAgentChange(
                                          agent.id,
                                          checked as boolean,
                                       )
                                    }
                                 />
                                 <Label
                                    htmlFor={`agent-${agent.id}`}
                                    className="text-sm font-normal cursor-pointer"
                                 >
                                    {agent.name}
                                 </Label>
                              </div>
                           ))}
                        </div>
                     </div>

                     <Separator />

                     {/* Clear Filters */}
                     <Button
                        variant="outline"
                        onClick={clearFilters}
                        disabled={!hasActiveFilters}
                        className="w-full"
                     >
                        Clear All Filters
                     </Button>
                  </div>
               </CredenzaContent>
            </Credenza>
         </div>

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
