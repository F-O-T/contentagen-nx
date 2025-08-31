import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
} from "@packages/ui/components/dialog";
import { Button } from "@packages/ui/components/button";
import { Checkbox } from "@packages/ui/components/checkbox";
import { Label } from "@packages/ui/components/label";
import { Separator } from "@packages/ui/components/separator";
import type { RouterInput, RouterOutput } from "@packages/api/client";

type Statuses = RouterInput["content"]["listAllContent"]["status"];
interface FilteringCredenzaProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   selectedStatuses: Statuses;
   selectedAgents: string[];
   onStatusesChange: (statuses: Statuses) => void;
   onAgentsChange: (agents: string[]) => void;
   agents: RouterOutput["agent"]["list"];
}

const allStatuses = [
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

export function FilteringCredenza({
   open,
   onOpenChange,
   selectedStatuses,
   selectedAgents,
   onStatusesChange,
   onAgentsChange,
   agents,
}: FilteringCredenzaProps) {
   const handleStatusChange = (status: Statuses[number], checked: boolean) => {
      if (checked) {
         onStatusesChange([...selectedStatuses, status]);
      } else {
         onStatusesChange(selectedStatuses.filter((s) => s !== status));
      }
   };

   const handleAgentChange = (agentId: string, checked: boolean) => {
      if (checked) {
         onAgentsChange([...selectedAgents, agentId]);
      } else {
         onAgentsChange(selectedAgents.filter((id) => id !== agentId));
      }
   };

   const clearFilters = () => {
      onStatusesChange([]);
      onAgentsChange([]);
   };

   return (
      <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent className="max-w-md">
            <DialogHeader>
               <DialogTitle>Filter Content</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
               <div>
                  <h3 className="text-sm font-medium mb-3">Status</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                     {allStatuses.map((status) => (
                        <div
                           key={status.value}
                           className="flex items-center space-x-2"
                        >
                           <Checkbox
                              id={`status-${status.value}`}
                              checked={selectedStatuses.includes(
                                 status.value as Statuses[number],
                              )}
                              onCheckedChange={(checked) =>
                                 handleStatusChange(
                                    status.value as Statuses[number],
                                    checked as boolean,
                                 )
                              }
                           />
                           <Label
                              htmlFor={`status-${status.value}`}
                              className="text-sm font-normal"
                           >
                              {status.label}
                           </Label>
                        </div>
                     ))}
                  </div>
               </div>

               <Separator />

               <div>
                  <h3 className="text-sm font-medium mb-3">Agent</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                     {agents.map((agent) => (
                        <div
                           key={agent.id}
                           className="flex items-center space-x-2"
                        >
                           <Checkbox
                              id={`agent-${agent.id}`}
                              checked={selectedAgents.includes(agent.id)}
                              onCheckedChange={(checked) =>
                                 handleAgentChange(agent.id, checked as boolean)
                              }
                           />
                           <Label
                              htmlFor={`agent-${agent.id}`}
                              className="text-sm font-normal"
                           >
                              {agent.personaConfig.metadata.name}
                           </Label>
                        </div>
                     ))}
                  </div>
               </div>

               <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={clearFilters}>
                     Clear All
                  </Button>
                  <Button onClick={() => onOpenChange(false)}>
                     Apply Filters
                  </Button>
               </div>
            </div>
         </DialogContent>
      </Dialog>
   );
}
