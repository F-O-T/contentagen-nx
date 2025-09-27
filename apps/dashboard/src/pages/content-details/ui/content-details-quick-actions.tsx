import { useRouter } from "@tanstack/react-router";
import { Button } from "@packages/ui/components/button";
import { translate } from "@packages/localization";
import {
   Edit,
   Trash2,
   RotateCcw,
   CheckCircle,
   Upload,
   Share,
   Lock,
   Eye,
} from "lucide-react";
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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/integrations/clients";
import { toast } from "sonner";
import { useState } from "react";
import type { ContentSelect } from "@packages/database/schema";
import { ContentDeleteConfirmationCredenza } from "../../content-list/features/content-delete-confirmation-credenza";
import { UploadContentImage } from "./upload-content-image";
import { BlogPreviewCredenza } from "./blog-preview-credenza";

export function ContentDetailsQuickActions({
   content,
   onEditBody,
}: {
   content: ContentSelect;
   onEditBody: () => void;
}) {
   const router = useRouter();
   const trpc = useTRPC();
   const queryClient = useQueryClient();
   const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
   const [uploadImageOpen, setUploadImageOpen] = useState(false);
   const [blogPreviewOpen, setBlogPreviewOpen] = useState(false);

   const regenerateMutation = useMutation(
      trpc.content.regenerate.mutationOptions({
         onSuccess: async () => {
            toast.success(
               translate("pages.content-details.messages.regenerate-success"),
            );
            await queryClient.invalidateQueries({
               queryKey: trpc.content.get.queryKey({ id: content.id }),
            });
            await queryClient.invalidateQueries({
               queryKey: trpc.content.listAllContent.queryKey(),
            });
            await queryClient.invalidateQueries({
               queryKey: trpc.content.versions.getVersions.queryKey({
                  contentId: content.id,
               }),
            });
         },
         onError: (error) => {
            toast.error(
               translate("pages.content-details.messages.regenerate-error", {
                  error: error.message ?? "Unknown error",
               }),
            );
         },
      }),
   );

   const approveMutation = useMutation(
      trpc.content.approve.mutationOptions({
         onSuccess: async () => {
            toast.success(
               translate("pages.content-details.messages.approve-success"),
            );
            await queryClient.invalidateQueries({
               queryKey: trpc.content.get.queryKey({ id: content.id }),
            });
            await queryClient.invalidateQueries({
               queryKey: trpc.content.listAllContent.queryKey(),
            });
            await queryClient.invalidateQueries({
               queryKey: trpc.content.versions.getVersions.queryKey({
                  contentId: content.id,
               }),
            });
         },
         onError: (error) => {
            toast.error(
               translate("pages.content-details.messages.approve-error", {
                  error: error.message ?? "Unknown error",
               }),
            );
         },
      }),
   );

   const deleteMutation = useMutation(
      trpc.content.delete.mutationOptions({
         onSuccess: () => {
            toast.success(
               translate("pages.content-details.messages.delete-success"),
            );
            router.navigate({
               to: "/content",
               search: { agentId: content.agentId, page: 1 },
            });
         },
         onError: (error) => {
            toast.error(
               translate("pages.content-details.messages.delete-error", {
                  error: error.message ?? "Unknown error",
               }),
            );
         },
      }),
   );

   const toggleShareMutation = useMutation(
      trpc.content.toggleShare.mutationOptions({
         onSuccess: async (data) => {
            const status =
               data.shareStatus === "shared"
                  ? translate("pages.content-details.status.shared")
                  : translate("pages.content-details.status.private");
            toast.success(
               translate("pages.content-details.messages.share-success", {
                  status,
               }),
            );
            await queryClient.invalidateQueries({
               queryKey: trpc.content.get.queryKey({ id: content.id }),
            });
            await queryClient.invalidateQueries({
               queryKey: trpc.content.listAllContent.queryKey(),
            });
         },
         onError: (error) => {
            toast.error(
               translate("pages.content-details.messages.share-error", {
                  error: error.message ?? "Unknown error",
               }),
            );
         },
      }),
   );

   const handleRegenerate = () => {
      regenerateMutation.mutate({ id: content.id });
   };

   const handleApprove = () => {
      approveMutation.mutate({ id: content.id });
   };

   const handleDeleteConfirm = () => {
      deleteMutation.mutate({ id: content.id });
      setDeleteDialogOpen(false);
   };

   const handleToggleShare = () => {
      toggleShareMutation.mutate({ id: content.id });
   };

   interface ActionItem {
      icon: React.ComponentType<{ className?: string }>;
      label: string;
      onClick: () => void;
      disabled: boolean;
   }

   const actions: ActionItem[] = [
      {
         icon: RotateCcw,
         label: translate("pages.content-details.quick-actions.regenerate"),
         onClick: handleRegenerate,
         disabled: regenerateMutation.isPending,
      },
      {
         icon: Edit,
         label: translate("pages.content-details.quick-actions.edit"),
         onClick: onEditBody,
         disabled: false,
      },
      {
         icon: Upload,
         label: translate("pages.content-details.quick-actions.upload-image"),
         onClick: () => setUploadImageOpen(true),
         disabled: false,
      },
      {
         icon: Eye,
         label: translate("pages.content-details.quick-actions.preview"),
         onClick: () => setBlogPreviewOpen(true),
         disabled: false,
      },
      {
         icon: CheckCircle,
         label: translate("pages.content-details.quick-actions.approve"),
         onClick: handleApprove,
         disabled: approveMutation.isPending || content.status === "approved",
      },
      {
         icon: content.shareStatus === "shared" ? Lock : Share,
         label:
            content.shareStatus === "shared"
               ? translate("pages.content-details.quick-actions.make-private")
               : translate("pages.content-details.quick-actions.share"),
         onClick: handleToggleShare,
         disabled: toggleShareMutation.isPending,
      },
      {
         icon: Trash2,
         label: translate("pages.content-details.quick-actions.delete"),
         onClick: () => setDeleteDialogOpen(true),
         disabled: false,
      },
   ];

   return (
      <>
         <Card>
            <CardHeader>
               <CardTitle>
                  {translate("pages.content-details.quick-actions.title")}
               </CardTitle>
               <CardDescription>
                  {translate("pages.content-details.quick-actions.description")}
               </CardDescription>
            </CardHeader>
            <CardContent className="w-full flex items-center justify-center gap-2 flex-wrap">
               {actions.map((action, index) => (
                  <Tooltip key={`content-action-${index + 1}`}>
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

         <ContentDeleteConfirmationCredenza
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            contentTitle={
               content.meta?.title ||
               translate("pages.content-details.messages.untitled-content")
            }
            onConfirm={handleDeleteConfirm}
         />

         <UploadContentImage
            content={content}
            open={uploadImageOpen}
            onOpenChange={setUploadImageOpen}
         />
         <BlogPreviewCredenza
            content={content}
            open={blogPreviewOpen}
            onOpenChange={setBlogPreviewOpen}
         />
      </>
   );
}
