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
import { CreateEditBrandDialog } from "../../brand-list/features/create-edit-brand-dialog";
import { useState } from "react";
import { DeleteBrandConfirmationDialog } from "../../brand-list/features/delete-brand-confirmation-dialog";
import type { RouterOutput } from "@packages/api/client";
import { translate } from "@packages/localization";

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
               message: translate(
                  "pages.brand-details.messages.analysis-started",
               ),
            });
            queryClient.invalidateQueries({
               queryKey: trpc.brand.get.queryKey({ id: brand.id }),
            });
         },
         onError: (error) => {
            createToast({
               type: "danger",
               message: translate(
                  "pages.brand-details.messages.analysis-error",
                  {
                     error: error.message ?? "Unknown error",
                  },
               ),
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
         label: translate(
            "pages.brand-details.actions.buttons.visit-website",
         ),
         onClick: handleVisitWebsite,
         disabled: !brand.websiteUrl,
      },
      {
         icon: RefreshCw,
         label: analyzeMutation.isPending
            ? translate("pages.brand-details.actions.buttons.analyzing")
            : translate(
                 "pages.brand-details.actions.buttons.refresh-analysis",
              ),
         onClick: handleAnalyze,
         disabled: analyzeMutation.isPending,
      },
      {
         icon: Upload,
         label: translate(
            "pages.brand-details.actions.buttons.upload-logo",
         ),
         onClick: onLogoUpload,
         disabled: !onLogoUpload,
      },
      {
         icon: Edit,
         label: translate(
            "pages.brand-details.actions.buttons.edit-brand",
         ),
         onClick: () => setShowEditDialog(true),
         disabled: false,
      },
      {
         icon: Trash,
         label: translate(
            "pages.brand-details.actions.buttons.delete-brand",
         ),
         onClick: () => setShowDeleteDialog(true),
         disabled: false,
      },
   ];

   return (
      <>
         <Card>
            <CardHeader>
               <CardTitle>
                  {translate("pages.brand-details.actions.card.title")}
               </CardTitle>
               <CardDescription>
                  {translate(
                     "pages.brand-details.actions.card.description",
                  )}
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