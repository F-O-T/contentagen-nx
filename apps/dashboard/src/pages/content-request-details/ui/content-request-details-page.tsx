import { useState } from "react";

import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";

import { TalkingMascot } from "@/widgets/talking-mascot/ui/talking-mascot";
import {
   AlertDialog,
   AlertDialogAction,
   AlertDialogCancel,
   AlertDialogContent,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogHeader,
   AlertDialogTitle,
} from "@packages/ui/components/alert-dialog";
import { SquaredIconButton } from "@packages/ui/components/squared-icon-button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useRouteContext } from "@tanstack/react-router";
import { toast } from "sonner";
import { useContentExport } from "../lib/use-content-export";
import { useContentRequestDetails } from "../lib/use-content-request-details";
import { GeneratedContentDisplay } from "./generated-content-display";
import { ContentStatsCard, RequestDetailsCard } from "./request-details-cards";

export function ContentRequestDetailsPage() {
   const navigate = useNavigate();
   const queryClient = useQueryClient();
   const { eden } = useRouteContext({
      from: "/_dashboard/content/requests/$requestId/",
   });
   const { request, generatedContent, isLoading } = useContentRequestDetails();
   const { exportContent, isExporting } = useContentExport();

   const [alertOpen, setAlertOpen] = useState(false);

   // Delete mutation
   const { mutate: deleteContentRequest, isPending: isDeleting } = useMutation({
      mutationFn: async (id: string) =>
         await eden.api.v1.content.request({ id }).delete(),
      onError: () => {
         toast.error("Failed to delete content request");
      },
      onSuccess: () => {
         queryClient.invalidateQueries({
            queryKey: ["get-content-requests"],
         });
         toast.success("Content request deleted successfully");
         navigate({ to: "/content" });
      },
   });

   // Approve content request mutation
   const { mutate: approveRequest, isPending: isApproving } = useMutation({
      mutationFn: async (id: string) =>
         await eden.api.v1.content.management.approve({ id }).post(),
      onError: () => {
         toast.error("Failed to approve content request");
      },
      onSuccess: () => {
         queryClient.invalidateQueries();
         toast.success("Content request approved and queued for generation");
      },
   });

   // Reject content request mutation
   const { mutate: rejectRequest, isPending: isRejecting } = useMutation({
      mutationFn: async (id: string) =>
         await eden.api.v1.content.management.reject({ id }).post(),
      onError: () => {
         toast.error("Failed to reject content request");
      },
      onSuccess: () => {
         queryClient.invalidateQueries();
         toast.success("Content request rejected");
      },
   });

   const handleApproveRequest = () => {
      if (!request?.id) return;
      approveRequest(request.id);
   };

   const handleRejectRequest = () => {
      if (!request?.id) return;
      rejectRequest(request.id);
   };

   const handleExportContent = (
      format: "html" | "markdown" | "mdx",
      content?: string,
   ) => {
      // Use the provided content (edited) or fall back to original generated content
      const contentToExport = content || generatedContent?.body;

      if (!contentToExport || !request?.topic) return;

      exportContent({
         content: contentToExport,
         format,
         filename: request.topic.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase(),
      });
   };

   if (isLoading) {
      return (
         <div className="h-full w-full flex items-center justify-center">
            Loading...
         </div>
      );
   }

   if (!request) {
      return <div>Content request not found</div>;
   }

   return (
      <main className="h-full w-full flex flex-col gap-6">
         <TalkingMascot message="Here's your content request details! You can review, edit, and manage your generated content. Use the export options to get your content in different formats." />
         {!request.approved && (
            <Card>
               <CardHeader>
                  <CardTitle>Request Status</CardTitle>
                  <CardDescription>
                     Approve or reject the generation of this content request
                  </CardDescription>
               </CardHeader>
               <CardContent className="grid grid-cols-2 gap-4">
                  <SquaredIconButton
                     onClick={handleApproveRequest}
                     disabled={isApproving}
                  >
                     {isApproving ? "Approving..." : "Approve"}
                  </SquaredIconButton>
                  <SquaredIconButton
                     onClick={handleRejectRequest}
                     disabled={isRejecting}
                  >
                     {isRejecting ? "Rejecting..." : "Reject"}
                  </SquaredIconButton>
               </CardContent>
            </Card>
         )}

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Request Details */}
            <div className="lg:col-span-1 space-y-4">
               <RequestDetailsCard request={request} />
               <ContentStatsCard generatedContent={generatedContent} />
            </div>

            {/* Generated Content */}
            <div className="lg:col-span-2">
               <GeneratedContentDisplay
                  generatedContent={generatedContent}
                  isExporting={isExporting}
                  isGenerating={!request.isCompleted}
                  onExport={handleExportContent}
               />
            </div>
         </div>

         {/* Delete Confirmation Dialog */}
         <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
            <AlertDialogContent>
               <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                     This action cannot be undone. This will permanently delete
                     your content request and all associated data.
                  </AlertDialogDescription>
               </AlertDialogHeader>
               <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                     onClick={() => deleteContentRequest(request.id)}
                     disabled={isDeleting}
                  >
                     {isDeleting ? "Deleting..." : "Delete"}
                  </AlertDialogAction>
               </AlertDialogFooter>
            </AlertDialogContent>
         </AlertDialog>
      </main>
   );
}
