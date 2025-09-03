import {
   Card,
   CardAction,
   CardContent,
   CardDescription,
   CardFooter,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { Checkbox } from "@packages/ui/components/checkbox";
import {
   Credenza,
   CredenzaContent,
   CredenzaHeader,
   CredenzaTitle,
   CredenzaDescription,
   CredenzaTrigger,
   CredenzaBody,
} from "@packages/ui/components/credenza";
import { ContentDeleteConfirmationCredenza } from "../features/content-delete-confirmation-credenza";
import { Trash2, Eye, Lock, Globe } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { Badge } from "@packages/ui/components/badge";
import type { RouterOutput } from "@packages/api/client";
import { AgentWriterCard } from "@/widgets/agent-display-card/ui/agent-writter-card";
import { useTRPC } from "@/integrations/clients";
import {
   useSuspenseQuery,
   useMutation,
   useQueryClient,
} from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { SquaredIconButton } from "@packages/ui/components/squared-icon-button";
import { formatValueForDisplay } from "@packages/helpers/text";
import { useContentList } from "../lib/content-list-context";

export function ContentRequestCard({
   request,
}: {
   request: RouterOutput["content"]["listAllContent"]["items"][0];
}) {
   const { selectedItems, handleSelectionChange } = useContentList();
   const trpc = useTRPC();
   const queryClient = useQueryClient();
   const navigate = useNavigate();
   const { data: profilePhoto } = useSuspenseQuery(
      trpc.agentFile.getProfilePhoto.queryOptions({
         agentId: request.agent?.id,
      }),
   );

   const [isCredenzaOpen, setIsCredenzaOpen] = useState(false);
   const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

   const deleteMutation = useMutation(
      trpc.content.delete.mutationOptions({
         onSuccess: async () => {
            toast.success("Content deleted successfully");
            setIsCredenzaOpen(false);
            // Invalidate queries to refresh the list
            await queryClient.invalidateQueries({
               queryKey: trpc.content.listAllContent.queryKey(),
            });
         },
         onError: (error) => {
            toast.error("Failed to delete content");
            console.error("Delete error:", error);
         },
      }),
   );

   const handleView = useCallback(() => {
      navigate({
         to: "/content/$id",
         params: { id: request.id },
      });
      setIsCredenzaOpen(false);
   }, [navigate, request.id]);

   const handleDelete = useCallback(() => {
      setShowDeleteConfirmation(true);
   }, []);

   const confirmDelete = useCallback(async () => {
      await deleteMutation.mutateAsync({ id: request.id });
      setShowDeleteConfirmation(false);
   }, [deleteMutation, request.id]);

   return (
      <>
         <Credenza open={isCredenzaOpen} onOpenChange={setIsCredenzaOpen}>
            <CredenzaTrigger asChild>
               <Card className="cursor-pointer">
                  <CardHeader>
                     <CardTitle className="line-clamp-1">
                        {request.meta?.title}
                     </CardTitle>
                     <CardDescription className="line-clamp-2">
                        {request.meta?.description ?? "No description found"}
                     </CardDescription>
                     <CardAction>
                        <Checkbox
                           checked={selectedItems.has(request.id)}
                           disabled={
                              !["draft", "approved", "pending"].includes(
                                 request.status || "",
                              )
                           }
                           onCheckedChange={(checked) =>
                              handleSelectionChange(
                                 request.id,
                                 checked as boolean,
                              )
                           }
                           onClick={(e) => e.stopPropagation()}
                        />
                     </CardAction>
                  </CardHeader>
                  <CardContent>
                     <AgentWriterCard
                        photo={profilePhoto?.data}
                        name={
                           request.agent?.personaConfig.metadata.name ||
                           "Unknown"
                        }
                        description={
                           request.agent?.personaConfig.metadata.description ||
                           "No description"
                        }
                     />
                  </CardContent>
                  <CardFooter className="flex items-center justify-between">
                     <Badge variant="outline">
                        {new Date(request.createdAt).toLocaleDateString()}
                     </Badge>
                     <div className="flex items-center gap-2">
                        <Badge className="text-xs">
                           {formatValueForDisplay(request.status ?? "")}
                        </Badge>
                        {request.shareStatus === "shared" ? (
                           <Globe className="w-4 h-4 text-muted-foreground" />
                        ) : (
                           <Lock className="w-4 h-4 text-muted-foreground" />
                        )}
                     </div>
                  </CardFooter>
               </Card>
            </CredenzaTrigger>
            <CredenzaContent>
               <CredenzaHeader>
                  <CredenzaTitle>
                     {request.meta?.title || "Content"}
                  </CredenzaTitle>
                  <CredenzaDescription>
                     {request.meta?.description || "No description available"}
                  </CredenzaDescription>
               </CredenzaHeader>
               <CredenzaBody className="grid grid-cols-2 gap-2">
                  <SquaredIconButton onClick={handleView}>
                     <Eye className="h-4 w-4" />
                     View your content details
                  </SquaredIconButton>

                  <SquaredIconButton
                     destructive
                     onClick={handleDelete}
                     disabled={deleteMutation.isPending}
                  >
                     <Trash2 className="h-4 w-4" />
                     {deleteMutation.isPending
                        ? "Deleting..."
                        : "Delete this content"}
                  </SquaredIconButton>
               </CredenzaBody>
            </CredenzaContent>
         </Credenza>
         <ContentDeleteConfirmationCredenza
            open={showDeleteConfirmation}
            onOpenChange={setShowDeleteConfirmation}
            contentTitle={request.meta?.title || "this content"}
            onConfirm={confirmDelete}
         />
      </>
   );
}
