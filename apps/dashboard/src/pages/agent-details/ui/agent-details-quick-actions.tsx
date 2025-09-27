import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { Button } from "@packages/ui/components/button";
import { translate } from "@packages/localization";
import { Edit, Trash, Plus, Camera, FileEdit } from "lucide-react";
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import {
   Tooltip,
   TooltipTrigger,
   TooltipContent,
} from "@packages/ui/components/tooltip";
import { DeleteAgentDialog } from "@/features/agent-actions/ui/delete-agent-dialog";
import { EditAgentAction } from "@/features/agent-actions/ui/edit-agent-action";
import { ManageAgentPhoto } from "../features/manage-agent-photo";
import type { RouterOutput } from "@packages/api/client";

interface AgentDetailsQuickActionsProps {
   agent: RouterOutput["agent"]["get"];
   onEditInstructions?: () => void;
}

type Agent = RouterOutput["agent"]["get"];
export function AgentDetailsQuickActions({ agent, onEditInstructions }: AgentDetailsQuickActionsProps) {
   const router = useRouter();

   const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
   const [managePhotoOpen, setManagePhotoOpen] = useState(false);
   const { handleEdit } = EditAgentAction({ agentId: agent?.id ?? "" });

   const handleCreateContent = () => {
      router.navigate({
         to: "/agents/$agentId/content/request",
         params: { agentId: agent?.id ?? "" },
      });
   };

   const actions = [
      {
         icon: Edit,
         label: translate("pages.agent-details.quick-actions.edit-agent"),
         onClick: handleEdit,
         disabled: false,
      },
      {
         icon: FileEdit,
         label: translate("pages.agent-details.quick-actions.edit-instructions"),
         onClick: onEditInstructions,
         disabled: !onEditInstructions,
      },
      {
         icon: Trash,
         label: translate("pages.agent-details.quick-actions.delete-agent"),
         onClick: () => setDeleteDialogOpen(true),
         disabled: false,
      },
      {
         icon: Plus,
         label: translate("pages.agent-details.quick-actions.create-content"),
         onClick: handleCreateContent,
         disabled: false,
      },
      {
         icon: Camera,
         label: translate(
            "pages.agent-details.quick-actions.manage-agent-photo",
         ),
         onClick: () => setManagePhotoOpen(true),
         disabled: false,
      },
   ];

   return (
      <>
         <Card>
            <CardHeader>
               <CardTitle>
                  {translate("pages.agent-details.quick-actions.title")}
               </CardTitle>
               <CardDescription>
                  {translate("pages.agent-details.quick-actions.description")}
               </CardDescription>
            </CardHeader>
            <CardContent className="w-full flex items-center justify-center gap-4">
               {actions.map((action, index) => (
                  <Tooltip key={`agent-action-${index + 1}`}>
                     <TooltipTrigger asChild>
                        <Button
                           size="icon"
                           variant="outline"
                           onClick={action.onClick}
                           disabled={action.disabled}
                        >
                           <action.icon />
                        </Button>
                     </TooltipTrigger>
                     <TooltipContent>{action.label}</TooltipContent>
                  </Tooltip>
               ))}
            </CardContent>
         </Card>

         <DeleteAgentDialog
            agentId={agent?.id ?? ""}
            agentName={agent?.personaConfig.metadata.name ?? ""}
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
         />

         <ManageAgentPhoto
            agent={agent}
            open={managePhotoOpen}
            onOpenChange={setManagePhotoOpen}
         />
      </>
   );
}
