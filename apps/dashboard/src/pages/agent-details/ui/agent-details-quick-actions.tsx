import { useMemo, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { Button } from "@packages/ui/components/button";
import { translate } from "@packages/localization";
import { File, Edit, Trash, Plus, Camera, AlertTriangle } from "lucide-react";
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
import { GenerateBrandFilesCredenza } from "../features/dynamic-brand-files";
import { DeleteAgentDialog } from "@/features/agent-actions/ui/delete-agent-dialog";
import { EditAgentAction } from "@/features/agent-actions/ui/edit-agent-action";
import { ManageAgentPhoto } from "../features/manage-agent-photo";
import { DeleteAllFiles } from "../features/delete-all-files";
import type { AgentSelect } from "@packages/database/schema";
import type { PersonaConfig } from "@packages/database/schemas/agent";
import { AGENT_FILE_UPLOAD_LIMIT } from "@packages/files/text-file-helper";

export function AgentDetailsQuickActions({ agent }: { agent: AgentSelect }) {
   const router = useRouter();

   const shouldDisableBrandFileGeneration = useMemo(() => {
      if (!agent) return true;
      const currentFileCount = agent?.uploadedFiles?.length || 0;
      return Boolean(currentFileCount >= AGENT_FILE_UPLOAD_LIMIT);
   }, [agent]);

   const hasUploadedFiles = useMemo(() => {
      return (agent?.uploadedFiles?.length || 0) > 0;
   }, [agent]);

   const [open, setOpen] = useState(false);
   const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
   const [managePhotoOpen, setManagePhotoOpen] = useState(false);
   const [deleteAllFilesOpen, setDeleteAllFilesOpen] = useState(false);
   const { handleEdit } = EditAgentAction({ agentId: agent.id });

   const handleCreateContent = () => {
      router.navigate({
         to: "/agents/$agentId/content/request",
         params: { agentId: agent.id },
      });
   };

   const actions = [
      {
         icon: File,
         label: translate(
            "pages.agent-details.quick-actions.generate-brand-files",
         ),
         onClick: () => setOpen(true),
         disabled: shouldDisableBrandFileGeneration,
      },

      {
         icon: Edit,
         label: translate("pages.agent-details.quick-actions.edit-agent"),
         onClick: handleEdit,
         disabled: false,
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
      {
         icon: AlertTriangle,
         label: hasUploadedFiles
            ? translate("pages.agent-details.quick-actions.delete-all-files")
            : translate("pages.agent-details.quick-actions.no-files-to-delete"),
         onClick: () => setDeleteAllFilesOpen(true),
         disabled: !hasUploadedFiles,
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

         <GenerateBrandFilesCredenza open={open} onOpenChange={setOpen} />

         <DeleteAgentDialog
            agentId={agent.id}
            agentName={(agent.personaConfig as PersonaConfig).metadata.name}
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
         />

         <ManageAgentPhoto
            agent={agent}
            open={managePhotoOpen}
            onOpenChange={setManagePhotoOpen}
         />

         <DeleteAllFiles
            agent={agent}
            open={deleteAllFilesOpen}
            onOpenChange={setDeleteAllFilesOpen}
         />
      </>
   );
}
