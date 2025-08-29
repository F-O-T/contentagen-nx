import { Button } from "@packages/ui/components/button";
import { Label } from "@packages/ui/components/label";
import { ChevronLeft, ChevronRight, Filter, Settings } from "lucide-react";
import { Checkbox } from "@packages/ui/components/checkbox";
import {
   Credenza,
   CredenzaTrigger,
   CredenzaContent,
   CredenzaHeader,
   CredenzaTitle,
} from "@packages/ui/components/credenza";
import {
   DropdownMenu,
   DropdownMenuTrigger,
   DropdownMenuContent,
   DropdownMenuItem,
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

const limitOptions = [4, 7, 11, 15, 19];

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

   return (
      <div className="flex items-center justify-between gap-4 p-4 bg-background border rounded-lg shadow-sm">
         {/* Left side - Filter button */}
         <div className="flex items-center gap-2">
            <Credenza open={isFilterOpen} onOpenChange={setIsFilterOpen}>
               <CredenzaTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                     <Filter className="h-4 w-4" />
                     Filter
                     {hasActiveFilters && (
                        <span className="ml-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
                           {selectedStatuses.length + selectedAgents.length}
                        </span>
                     )}
                  </Button>
               </CredenzaTrigger>
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

         {/* Right side - Limit selector */}
         <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Show:</span>
            <DropdownMenu>
               <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                     <Settings className="h-4 w-4" />
                     {limit}
                  </Button>
               </DropdownMenuTrigger>
               <DropdownMenuContent align="end">
                  {limitOptions.map((option) => (
                     <DropdownMenuItem
                        key={option}
                        onClick={() => onLimitChange(option)}
                        className={limit === option ? "bg-accent" : ""}
                     >
                        {option} items
                     </DropdownMenuItem>
                  ))}
               </DropdownMenuContent>
            </DropdownMenu>
         </div>
      </div>
   );
}
