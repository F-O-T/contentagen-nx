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
import { createToast } from "@/features/error-modal/lib/create-toast";
import {
   Tooltip,
   TooltipTrigger,
   TooltipContent,
} from "@packages/ui/components/tooltip";
import { CreateEditBrandDialog } from "../features/create-edit-brand-dialog";
import { useState } from "react";
import { DeleteBrandConfirmationDialog } from "../features/delete-brand-confirmation-dialog";
import type { RouterOutput } from "@packages/api/client";

interface BrandDetailsActionsProps {
   brand: RouterOutput["brand"]["list"]["items"][number];
   onLogoUpload?: () => void;
}

export function BrandDetailsActions({
   brand,
   onLogoUpload,
}: BrandDetailsActionsProps) {
   const trpc = useTRPC();
   const queryClient = useQueryClient();
   const [showEditDialog, setShowEditDialog] = useState(false);
   const [showDeleteDialog, setShowDeleteDialog] = useState(false);

   const analyzeMutation = useMutation(
      trpc.brand.analyze.mutationOptions({
         onSuccess: () => {
            createToast({
               type: "success",
               message: "Brand analysis started",
            });
            queryClient.invalidateQueries({
               queryKey: trpc.brand.getByOrganization.queryKey(),
            });
         },
         onError: (error) => {
            createToast({
               type: "danger",
               message: `Failed to start analysis: ${error.message ?? "Unknown error"}`,
            });
         },
      }),
   );

   const handleAnalyze = () => {
      analyzeMutation.mutate({ id: brand.id });
   };

   const handleVisitWebsite = () => {
      if (brand.websiteUrl) {
         window.open(brand.websiteUrl, "_blank", "noopener,noreferrer");
      }
   };

   const actions = [
      {
         icon: ExternalLink,
         label: "Visit Website",
         onClick: handleVisitWebsite,
         disabled: !brand.websiteUrl,
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
         label: "Edit Brand",
         onClick: () => setShowEditDialog(true),
         disabled: false,
      },
      {
         icon: Trash,
         label: "Delete Brand",
         onClick: () => setShowDeleteDialog(true),
         disabled: false,
      },
   ];

   return (
      <>
         <Card>
            <CardHeader>
               <CardTitle>Brand Actions</CardTitle>
               <CardDescription>
                  Quick actions to manage your brand and analysis.
               </CardDescription>
            </CardHeader>
            <CardContent className="w-full flex items-center justify-center gap-2">
               {actions.map((action, index) => (
                  <Tooltip key={`brand-action-${index + 1}`}>
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

         <CreateEditBrandDialog
            brand={brand}
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
         />

         <DeleteBrandConfirmationDialog
            brand={brand}
            open={showDeleteDialog}
            onOpenChange={setShowDeleteDialog}
         />
      </>
   );
}
