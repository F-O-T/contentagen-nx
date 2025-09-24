import {
   Card,
   CardContent,
   CardDescription,
   CardFooter,
   CardHeader,
   CardTitle,
   CardAction,
} from "@packages/ui/components/card";
import { Button } from "@packages/ui/components/button";
import { Badge } from "@packages/ui/components/badge";
import {
   DropdownMenu,
   DropdownMenuTrigger,
   DropdownMenuContent,
   DropdownMenuItem,
} from "@packages/ui/components/dropdown-menu";
import { FileText, MoreVertical } from "lucide-react";
import { FileViewerModal } from "../features/file-viewer-modal";
import { useState, useCallback, useMemo } from "react";
import { GenerateBrandFilesCredenza } from "../features/dynamic-brand-files";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { useTRPC } from "@/integrations/clients";
import { toast } from "sonner";
import { translate } from "@packages/localization";
import { AGENT_FILE_UPLOAD_LIMIT } from "@packages/files/text-file-helper";
import type { AgentSelect } from "@packages/database/schema";

export type UploadedFile = {
   fileName: string;
   fileUrl: string;
   uploadedAt: string;
};

function KnowledgeBaseEmptyState() {
   return (
      <div className="text-center py-8 text-muted-foreground">
         <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
         <p>
            {translate("pages.agent-details.knowledge-base.empty-state.title")}
         </p>
         <p className="text-sm">
            {translate(
               "pages.agent-details.knowledge-base.empty-state.description",
            )}
         </p>
      </div>
   );
}

export function AgentDetailsKnowledgeBaseCard({
   agent,
}: {
   agent: AgentSelect;
}) {
   const [showGenerateCredenza, setShowGenerateCredenza] = useState(false);
   const { agentId } = useParams({ from: "/_dashboard/agents/$agentId/" });
   const queryClient = useQueryClient();
   const trpc = useTRPC();
   const { open, Modal } = FileViewerModal();

   const deleteFileMutation = useMutation(
      trpc.agentFile.delete.mutationOptions({
         onSuccess: async () => {
            toast.success(
               translate(
                  "pages.agent-details.knowledge-base.messages.file-deleted",
               ),
            );
            await queryClient.invalidateQueries({
               queryKey: trpc.agent.get.queryKey({ id: agentId }),
            });
         },
         onError: () => {
            toast.error(
               translate(
                  "pages.agent-details.knowledge-base.messages.delete-failed",
               ),
            );
         },
      }),
   );

   const handleDeleteFile = useCallback(
      async (fileName: string) => {
         const fileToDelete = agent?.uploadedFiles?.find(
            (f: UploadedFile) => f.fileName === fileName,
         );
         if (fileToDelete) {
            await deleteFileMutation.mutateAsync({
               agentId,
               fileName: fileName,
            });
         }
      },
      [agent, agentId, deleteFileMutation],
   );

   const handleViewFile = useCallback(
      (fileName: string) => {
         open(fileName);
      },
      [open],
   );

   const uploadedFiles = useMemo(
      () => agent.uploadedFiles || [],
      [agent.uploadedFiles],
   );
   const canAddMore = useMemo(
      () => uploadedFiles.length < AGENT_FILE_UPLOAD_LIMIT,
      [uploadedFiles],
   );
   const remainingSlots = useMemo(
      () => AGENT_FILE_UPLOAD_LIMIT - uploadedFiles.length,
      [uploadedFiles],
   );

   return (
      <>
         <Card className="h-full">
            <CardHeader>
               <CardTitle>
                  {translate("pages.agent-details.knowledge-base.title")}
               </CardTitle>
               <CardDescription>
                  {translate("pages.agent-details.knowledge-base.description")}
               </CardDescription>
               <CardAction>
                  {agent.brandKnowledgeStatus === "completed" && (
                     <Badge className="font-semibold">
                        {translate(
                           "pages.agent-details.knowledge-base.status.indexed",
                        )}
                     </Badge>
                  )}
               </CardAction>
            </CardHeader>
            <CardContent className="grid gap-2">
               {uploadedFiles.map((file, index) => (
                  <div
                     key={`file-${index + 1}`}
                     className="flex items-center justify-between p-4 border rounded-lg"
                  >
                     <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <div>
                           <p className="font-medium text-sm">
                              {file.fileName}
                           </p>
                           <p className="text-xs text-muted-foreground">
                              {translate(
                                 "pages.agent-details.knowledge-base.status.uploaded",
                              )}{" "}
                              {new Date(file.uploadedAt).toLocaleDateString()}
                           </p>
                        </div>
                     </div>
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                           <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                           </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                           <DropdownMenuItem
                              onSelect={() => handleViewFile(file.fileName)}
                           >
                              {translate("common.actions.view")}
                           </DropdownMenuItem>
                           <DropdownMenuItem
                              onSelect={() => handleDeleteFile(file.fileName)}
                           >
                              {translate("common.actions.delete")}
                           </DropdownMenuItem>
                        </DropdownMenuContent>
                     </DropdownMenu>
                  </div>
               ))}
               {uploadedFiles.length === 0 && <KnowledgeBaseEmptyState />}
            </CardContent>
            <CardFooter className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
               <span>
                  {uploadedFiles.length}{" "}
                  {translate(
                     "pages.agent-details.knowledge-base.file-count.files-uploaded",
                  )}
               </span>
               <span>
                  {canAddMore
                     ? `${remainingSlots} ${translate("pages.agent-details.knowledge-base.file-count.more-file")}${remainingSlots > 1 ? translate("pages.agent-details.knowledge-base.file-count.more-files") : ""} ${translate("pages.agent-details.knowledge-base.file-count.allowed")}`
                     : translate(
                          "pages.agent-details.knowledge-base.file-count.upload-limit-reached",
                       )}
               </span>
            </CardFooter>
         </Card>
         <GenerateBrandFilesCredenza
            open={showGenerateCredenza}
            onOpenChange={setShowGenerateCredenza}
         />

         <Modal />
      </>
   );
}
