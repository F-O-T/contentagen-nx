import type { CompetitorSelect } from "@packages/database/schema";
import {
   Card,
   CardContent,
   CardHeader,
   CardTitle,
   CardDescription,
} from "@packages/ui/components/card";
import { Button } from "@packages/ui/components/button";
import { Badge } from "@packages/ui/components/badge";
import {
   ExternalLink,
   Share2,
   AlertTriangle,
   RefreshCw,
   Archive,
   FileText,
   Edit,
   Trash,
   ArrowLeft,
   Download,
   BarChart3,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
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

interface CompetitorDetailsActionsProps {
   competitor: CompetitorSelect;
}

interface FeatureMeta {
   confidence?: number;
   category?: string;
   tags?: string[];
   isNew?: boolean;
   isTrending?: boolean;
}

export function CompetitorDetailsActions({
   competitor,
}: CompetitorDetailsActionsProps) {
   const navigate = useNavigate();
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

   const getMeta = (feature: any): FeatureMeta => {
      return (feature.meta as FeatureMeta) || {};
   };

   const handleAnalyze = () => {
      analyzeMutation.mutate({ id: competitor.id });
   };

   const handleVisitWebsite = () => {
      window.open(competitor.websiteUrl, "_blank", "noopener,noreferrer");
   };

   const handleViewChangelog = () => {
      if (competitor.changelogUrl) {
         window.open(competitor.changelogUrl, "_blank", "noopener,noreferrer");
      }
   };

   const handleBackToList = () => {
      navigate({ to: "/competitors" });
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
      {
         icon: ArrowLeft,
         label: "Back to List",
         onClick: handleBackToList,
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
            <CardContent className="w-full flex items-center justify-center gap-4">
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

            {competitor.features && competitor.features.length > 0 && (
               <CardContent className="pt-3 border-t">
                  <div className="flex items-center justify-between mb-2">
                     <h4 className="text-sm font-medium text-gray-700">
                        Feature Stats
                     </h4>
                     <Badge variant="secondary" className="text-xs">
                        {competitor.features.length}
                     </Badge>
                  </div>
                  <div className="space-y-1 text-xs text-gray-600">
                     <div className="flex justify-between">
                        <span>New features:</span>
                        <span>
                           {
                              competitor.features.filter(
                                 (f) => getMeta(f).isNew,
                              ).length
                           }
                        </span>
                     </div>
                     <div className="flex justify-between">
                        <span>Trending:</span>
                        <span>
                           {
                              competitor.features.filter(
                                 (f) => getMeta(f).isTrending,
                              ).length
                           }
                        </span>
                     </div>
                     <div className="flex justify-between">
                        <span>Avg confidence:</span>
                        <span>
                           {Math.round(
                              (competitor.features.reduce((acc, f) => {
                                 const confidence = getMeta(f).confidence || 0;
                                 return acc + confidence;
                              }, 0) /
                                 competitor.features.length) *
                                 100,
                           )}
                           %
                        </span>
                     </div>
                  </div>
               </CardContent>
            )}
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
