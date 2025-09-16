import {
   Card,
   CardContent,
   CardHeader,
   CardTitle,
   CardDescription,
} from "@packages/ui/components/card";
import { Button } from "@packages/ui/components/button";
import { ExternalLink, RefreshCw, Edit, Trash, Upload } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/integrations/clients";
import { toast } from "sonner";
import {
   Tooltip,
   TooltipTrigger,
   TooltipContent,
} from "@packages/ui/components/tooltip";
import { CreateEditCompetitorDialog } from "../../competitor-list/features/create-edit-competitor-dialog";
import { useState } from "react";
import { DeleteCompetitorConfirmationDialog } from "../../competitor-list/features/delete-competitor-confirmation-dialog";
import type { RouterOutput } from "@packages/api/client";

interface CompetitorDetailsActionsProps {
   competitor: RouterOutput["competitor"]["list"]["items"][number];
   onLogoUpload?: () => void;
}

export function CompetitorDetailsActions({
   competitor,
   onLogoUpload,
}: CompetitorDetailsActionsProps) {
   const trpc = useTRPC();
   const queryClient = useQueryClient();
   const [showEditDialog, setShowEditDialog] = useState(false);
   const [showDeleteDialog, setShowDeleteDialog] = useState(false);

   const analyzeMutation = useMutation(
      trpc.competitor.analyze.mutationOptions({
         onSuccess: () => {
            toast.success("Competitor analysis started!");
            queryClient.invalidateQueries({
               queryKey: trpc.competitor.get.queryKey({ id: competitor.id }),
            });
         },
         onError: (error) => {
            toast.error(
               `Error starting analysis: ${error.message ?? "Unknown error"}`,
            );
         },
      }),
   );

   const handleAnalyze = () => {
      analyzeMutation.mutate({ id: competitor.id });
   };

   const handleVisitWebsite = () => {
      window.open(competitor.websiteUrl, "_blank", "noopener,noreferrer");
   };

   const actions = [
      {
         icon: ExternalLink,
         label: "Visit Website",
         onClick: handleVisitWebsite,
         disabled: false,
      },
      {
         icon: RefreshCw,
         label: analyzeMutation.isPending ? "Analyzing..." : "Refresh Analysis",
         onClick: handleAnalyze,
         disabled: analyzeMutation.isPending,
      },
      {
         icon: Upload,
         label: "Upload Logo",
         onClick: onLogoUpload,
         disabled: !onLogoUpload,
      },
      {
         icon: Edit,
         label: "Edit Competitor",
         onClick: () => setShowEditDialog(true),
         disabled: false,
      },
      {
         icon: Trash,
         label: "Delete Competitor",
         onClick: () => setShowDeleteDialog(true),
         disabled: false,
      },
   ];

   return (
      <>
         <Card>
            <CardHeader>
               <CardTitle>Quick Actions</CardTitle>
               <CardDescription>
                  Perform common tasks related to the competitor.
               </CardDescription>
            </CardHeader>
            <CardContent className="w-full flex items-center justify-center gap-2">
               {actions.map((action, index) => (
                  <Tooltip key={`competitor-action-${index + 1}`}>
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

         <CreateEditCompetitorDialog
            competitor={competitor}
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
         />

         <DeleteCompetitorConfirmationDialog
            competitor={competitor}
            open={showDeleteDialog}
            onOpenChange={setShowDeleteDialog}
         />
      </>
   );
}
