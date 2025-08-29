import React from "react";
import {
   Card,
   CardHeader,
   CardTitle,
   CardContent,
   CardFooter,
   CardAction,
   CardDescription,
} from "@packages/ui/components/card";
import { InfoItem } from "@packages/ui/components/info-item";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
} from "@packages/ui/components/dropdown-menu";
import { Button } from "@packages/ui/components/button";
import { Link } from "@tanstack/react-router";
import {
   Edit,
   MoreVertical,
   Users,
   FileText,
   CheckCircle2,
   Trash,
} from "lucide-react";
import { formatValueToTitleCase } from "@packages/ui/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTRPC } from "@/integrations/clients";
import { DeleteAgentDialog } from "@/features/agent-actions/ui/delete-agent-dialog";
import { EditAgentAction } from "@/features/agent-actions/ui/edit-agent-action";
import type { AgentSelect } from "@packages/database/schema";
import type { PersonaConfig } from "@packages/database/schemas/agent";

type AgentCardProps = {
   agent: AgentSelect;
};

export function AgentCard({ agent }: AgentCardProps) {
   const queryClient = useQueryClient();
   const trpc = useTRPC();
   const { mutate: transferAgent, isPending: isTransferPending } = useMutation(
      trpc.agent.transferToOrganization.mutationOptions({
         onError: () => {
            toast.error("Failed to transfer agent");
         },
         onSuccess: () => {
            queryClient.invalidateQueries({
               queryKey: trpc.agent.list.queryKey(),
            });
            toast.success("Agent transferred to organization");
         },
      }),
   );

   const { handleEdit } = EditAgentAction({ agentId: agent.id });
   const infoItems = React.useMemo(() => {
      const personaConfig = agent.personaConfig as PersonaConfig;

      // Extract voice communication style
      const voiceStyle = personaConfig.voice?.communication
         ? formatValueToTitleCase(
              personaConfig.voice.communication.replace("_", " "),
           )
         : "Not specified";

      // Extract audience base
      const audienceBase = personaConfig.audience?.base
         ? formatValueToTitleCase(personaConfig.audience.base.replace("_", " "))
         : "Not specified";

      // Extract purpose/channel if available
      const purpose = personaConfig.purpose
         ? formatValueToTitleCase(personaConfig.purpose.replace("_", " "))
         : null;

      return [
         {
            icon: <Users />,
            label: "Voice & Audience",
            value: `${voiceStyle} • ${audienceBase}`,
         },
         ...(purpose
            ? [
                 {
                    icon: <FileText />,
                    label: "Purpose",
                    value: purpose,
                 },
              ]
            : []),
      ];
   }, [agent]);
   const [dropdownOpen, setDropdownOpen] = React.useState(false);
   const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
   return (
      <Card>
         <CardHeader>
            <CardTitle className="line-clamp-1">
               {(agent.personaConfig as PersonaConfig).metadata.name}
            </CardTitle>
            <CardDescription className="line-clamp-1">
               {(agent.personaConfig as PersonaConfig).metadata.description}
            </CardDescription>
            <CardAction>
               <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
                  <DropdownMenuTrigger asChild>
                     <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setDropdownOpen(true)}
                     >
                        <MoreVertical className="w-5 h-5" />
                     </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end">
                     <DropdownMenuItem onClick={handleEdit}>
                        <Edit className="w-4 h-4 mr-2" /> Edit
                     </DropdownMenuItem>
                     {!agent.organizationId && (
                        <DropdownMenuItem
                           onClick={() => transferAgent({ id: agent.id })}
                           disabled={isTransferPending}
                        >
                           <CheckCircle2 className="w-4 h-4 mr-2" /> Transfer to
                           Organization
                        </DropdownMenuItem>
                     )}
                     <DropdownMenuItem
                        onClick={() => setDeleteDialogOpen(true)}
                     >
                        <Trash className="w-4 h-4 mr-2" /> Delete
                     </DropdownMenuItem>
                  </DropdownMenuContent>
               </DropdownMenu>
               <DeleteAgentDialog
                  agentId={agent.id}
                  agentName={
                     (agent.personaConfig as PersonaConfig).metadata.name
                  }
                  open={deleteDialogOpen}
                  onOpenChange={setDeleteDialogOpen}
               />
            </CardAction>
         </CardHeader>

         <CardContent className="flex flex-col gap-2">
            {infoItems.map((item) => (
               <InfoItem
                  key={item.label}
                  icon={item.icon}
                  label={item.label}
                  value={item.value}
               />
            ))}
         </CardContent>

         <CardFooter className="grid grid-cols-1 gap-2">
            <Link
               to={`/agents/$agentId`}
               params={{ agentId: agent.id }}
               className="flex-1"
            >
               <Button className="w-full" size="sm">
                  View details
               </Button>
            </Link>
         </CardFooter>
      </Card>
   );
}
