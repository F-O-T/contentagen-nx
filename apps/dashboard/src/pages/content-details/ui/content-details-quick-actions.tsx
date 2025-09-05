import { useRouter } from "@tanstack/react-router";
import { Button } from "@packages/ui/components/button";
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
            toast.success("Content regeneration triggered!");
         },
         onError: (error) => {
            toast.error(
               `Error regenerating content: ${error.message ?? "Unknown error"}`,
            );
         },
      }),
   );

   const approveMutation = useMutation(
      trpc.content.approve.mutationOptions({
         onSuccess: () => {
            toast.success("Content approved successfully!");
         },
         onError: (error) => {
            toast.error(
               `Error approving content: ${error.message ?? "Unknown error"}`,
            );
         },
      }),
   );

   const deleteMutation = useMutation(
      trpc.content.delete.mutationOptions({
         onSuccess: () => {
            toast.success("Content deleted successfully");
            router.navigate({
               to: "/content",
               search: { agentId: content.agentId, page: 1 },
            });
         },
         onError: (error) => {
            toast.error(
               `Error deleting content: ${error.message ?? "Unknown error"}`,
            );
         },
      }),
   );

   const toggleShareMutation = useMutation(
      trpc.content.toggleShare.mutationOptions({
         onSuccess: async (data) => {
            toast.success(
               `Content ${data.shareStatus === "shared" ? "shared" : "made private"} successfully!`,
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
               `Error toggling share status: ${error.message ?? "Unknown error"}`,
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
      isCustomComponent?: boolean;
   }

   const actions: ActionItem[] = [
      {
         icon: RotateCcw,
         label: "Regenerate Content",
         onClick: handleRegenerate,
         disabled: regenerateMutation.isPending,
      },
      {
         icon: Edit,
         label: "Edit Content Body",
         onClick: onEditBody,
         disabled: false,
      },
      {
         icon: Upload,
         label: "Upload Image",
         onClick: () => setUploadImageOpen(true),
         disabled: false,
      },
      {
         icon: Eye,
         label: "Blog Preview",
         onClick: () => setBlogPreviewOpen(true),
         disabled: false,
      },
      {
         icon: CheckCircle,
         label: "Approve Content",
         onClick: handleApprove,
         disabled: approveMutation.isPending || content.status === "approved",
      },
      {
         icon: content.shareStatus === "shared" ? Lock : Share,
         label:
            content.shareStatus === "shared" ? "Make Private" : "Share Content",
         onClick: handleToggleShare,
         disabled: toggleShareMutation.isPending,
      },
      {
         icon: Trash2,
         label: "Delete Content",
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
                  Perform common tasks related to this content.
               </CardDescription>
            </CardHeader>
            <CardContent className="w-full flex items-center justify-center gap-2 flex-wrap">
               {actions.map((action, index) => (
                  <Tooltip key={`content-action-${index + 1}`}>
                     <TooltipTrigger asChild>
                        {action.isCustomComponent &&
                           action.label === "Blog Preview" ? (
                           <BlogPreviewCredenza content={content} />
                        ) : (
                           <Button
                              size="icon"
                              variant="outline"
                              onClick={action.onClick}
                              disabled={action.disabled}
                              className="flex items-center gap-2"
                           >
                              <action.icon className="w-4 h-4" />
                           </Button>
                        )}
                     </TooltipTrigger>
                     <TooltipContent>{action.label}</TooltipContent>
                  </Tooltip>
               ))}
            </CardContent>
         </Card>

         <ContentDeleteConfirmationCredenza
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            contentTitle={content.meta?.title || "Untitled Content"}
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
