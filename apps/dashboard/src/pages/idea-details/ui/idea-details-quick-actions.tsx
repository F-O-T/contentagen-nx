import { useRouter } from "@tanstack/react-router";
import { Button } from "@packages/ui/components/button";
import { CheckCircle, Trash2 } from "lucide-react";
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
import { useMutation } from "@tanstack/react-query";
import { useTRPC } from "@/integrations/clients";
import { toast } from "sonner";
import { useState } from "react";
import type { IdeaSelect } from "@packages/database/schema";
import { ApproveConfirmationCredenza } from "../features/approve-confirmation-credenza";
import { IdeaDeleteConfirmationCredenza } from "../features/delete-confirmation-credenza";

export function IdeaDetailsQuickActions({ idea }: { idea: IdeaSelect }) {
   const router = useRouter();
   const trpc = useTRPC();
   const [approveDialogOpen, setApproveDialogOpen] = useState(false);
   const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

   const approveMutation = useMutation(
      trpc.ideas.approve.mutationOptions({
         onSuccess: async (data) => {
            toast.success(
               "Idea approved successfully and sent to content generation",
            );
            router.navigate({
               to: "/content/$id",
               params: {
                  id: data.content.id,
               },
            });
         },
         onError: (error) => {
            toast.error(
               `Error approving idea: ${error.message ?? "Unknown error"}`,
            );
         },
      }),
   );

   const deleteMutation = useMutation(
      trpc.ideas.delete.mutationOptions({
         onSuccess: () => {
            toast.success("Idea deleted successfully");
            router.navigate({
               to: "/ideas",
               search: { agentId: idea.agentId },
            });
         },
         onError: (error) => {
            toast.error(
               `Error deleting idea: ${error.message ?? "Unknown error"}`,
            );
         },
      }),
   );

   const handleApproveConfirm = () => {
      approveMutation.mutate({ id: idea.id });
      setApproveDialogOpen(false);
   };

   const handleDeleteConfirm = () => {
      deleteMutation.mutate({ id: idea.id });
      setDeleteDialogOpen(false);
   };

   const actions = [
      {
         icon: CheckCircle,
         label: "Approve Idea",
         onClick: () => setApproveDialogOpen(true),
         disabled: idea.status === "approved" || idea.status === "rejected",
      },
      {
         icon: Trash2,
         label: "Delete Idea",
         onClick: () => setDeleteDialogOpen(true),
         disabled: false,
      },
   ];

   return (
      <>
         <Card>
            <CardHeader>
               <CardTitle>Quick Actions</CardTitle>
               <CardDescription>
                  Perform common tasks related to this idea.
               </CardDescription>
            </CardHeader>
            <CardContent className="w-full flex items-center justify-center gap-2 flex-wrap">
               {actions.map((action, index) => (
                  <Tooltip key={`idea-action-${index + 1}`}>
                     <TooltipTrigger asChild>
                        <Button
                           size="icon"
                           variant="outline"
                           onClick={action.onClick}
                           disabled={action.disabled}
                           className="flex items-center gap-2"
                        >
                           <action.icon className="w-4 h-4" />
                        </Button>
                     </TooltipTrigger>
                     <TooltipContent>{action.label}</TooltipContent>
                  </Tooltip>
               ))}
            </CardContent>
         </Card>

         <ApproveConfirmationCredenza
            open={approveDialogOpen}
            onOpenChange={setApproveDialogOpen}
            onConfirm={handleApproveConfirm}
         />
         <IdeaDeleteConfirmationCredenza
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            onConfirm={handleDeleteConfirm}
         />
      </>
   );
}
