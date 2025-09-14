import {
   Card,
   CardHeader,
   CardFooter,
   CardAction,
} from "@packages/ui/components/card";
import { Checkbox } from "@packages/ui/components/checkbox";
import { Badge } from "@packages/ui/components/badge";
import {
   Credenza,
   CredenzaContent,
   CredenzaHeader,
   CredenzaTitle,
   CredenzaDescription,
   CredenzaTrigger,
   CredenzaBody,
} from "@packages/ui/components/credenza";
import { AgentWriterCard } from "@/widgets/agent-display-card/ui/agent-writter-card";
import { SquaredIconButton } from "@packages/ui/components/squared-icon-button";
import { useSuspenseQuery } from "@tanstack/react-query";
import { formatValueToTitleCase } from "@packages/ui/lib/utils";
import { useTRPC } from "@/integrations/clients";
import { useAgentList } from "../lib/agent-list-context";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, Edit, Trash2, PlusIcon } from "lucide-react";
import { DeleteAgentDialog } from "@/features/agent-actions/ui/delete-agent-dialog";
import { EditAgentAction } from "@/features/agent-actions/ui/edit-agent-action";
import type { AgentSelect } from "@packages/database/schema";
import type { PersonaConfig } from "@packages/database/schemas/agent";

type AgentCardProps = {
   agent: AgentSelect;
};

export function AgentCard({ agent }: AgentCardProps) {
   const trpc = useTRPC();
   const { selectedItems, handleSelectionChange } = useAgentList();
   const { data: profilePhoto } = useSuspenseQuery(
      trpc.agentFile.getProfilePhoto.queryOptions({
         agentId: agent.id,
      }),
   );

   const [isCredenzaOpen, setIsCredenzaOpen] = useState(false);
   const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
   const navigate = useNavigate();

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
      : "Not specified";

   const { handleEdit } = EditAgentAction({ agentId: agent.id });

   const handleViewDetails = () => {
      navigate({
         to: "/agents/$agentId",
         params: { agentId: agent.id },
      });
      setIsCredenzaOpen(false);
   };

   const handleViewContent = () => {
      navigate({
         to: "/agents/$agentId/content/request",
         params: { agentId: agent.id },
      });
      setIsCredenzaOpen(false);
   };

   const handleEditAgent = () => {
      handleEdit();
      setIsCredenzaOpen(false);
   };

   const handleDelete = () => {
      setDeleteDialogOpen(true);
   };

   return (
      <>
         <Credenza open={isCredenzaOpen} onOpenChange={setIsCredenzaOpen}>
            <CredenzaTrigger asChild>
               <Card className="cursor-pointer">
                  <CardHeader>
                     <AgentWriterCard
                        isHeader={true}
                        photo={profilePhoto?.data}
                        name={personaConfig.metadata.name}
                        description={personaConfig.metadata.description}
                     />

                     <CardAction>
                        <Checkbox
                           checked={selectedItems.has(agent.id)}
                           onCheckedChange={(checked) =>
                              handleSelectionChange(
                                 agent.id,
                                 checked as boolean,
                              )
                           }
                           onClick={(e) => e.stopPropagation()}
                        />
                     </CardAction>
                  </CardHeader>

                  <CardFooter className="flex items-center justify-between">
                     <Badge variant="outline">{purpose}</Badge>
                     <Badge className="text-xs">
                        {voiceStyle} • {audienceBase}
                     </Badge>
                  </CardFooter>
               </Card>
            </CredenzaTrigger>
            <CredenzaContent>
               <CredenzaHeader>
                  <CredenzaTitle>{personaConfig.metadata.name}</CredenzaTitle>
                  <CredenzaDescription>
                     {personaConfig.metadata.description}
                  </CredenzaDescription>
               </CredenzaHeader>
               <CredenzaBody className="grid grid-cols-2 gap-2">
                  <SquaredIconButton onClick={handleViewDetails}>
                     <Eye className="h-4 w-4" />
                     View agent details
                  </SquaredIconButton>

                  <SquaredIconButton onClick={handleViewContent}>
                     <PlusIcon className="h-4 w-4" />
                     Create new content
                  </SquaredIconButton>

                  <SquaredIconButton onClick={handleEditAgent}>
                     <Edit className="h-4 w-4" />
                     Edit agent
                  </SquaredIconButton>

                  <SquaredIconButton destructive onClick={handleDelete}>
                     <Trash2 className="h-4 w-4" />
                     Delete agent
                  </SquaredIconButton>
               </CredenzaBody>
            </CredenzaContent>
         </Credenza>
         <DeleteAgentDialog
            agentId={agent.id}
            agentName={personaConfig.metadata.name}
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
         />
      </>
   );
}
