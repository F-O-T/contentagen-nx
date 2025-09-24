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
import { CompetitorFileViewerModal } from "../features/competitor-file-viewer-modal";
import { useCallback, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { useTRPC } from "@/integrations/clients";
import { toast } from "sonner";
import { AGENT_FILE_UPLOAD_LIMIT } from "@packages/files/text-file-helper";
import type { CompetitorSelect } from "@packages/database/schema";
import { translate } from "@packages/localization";

export type UploadedFile = {
   fileName: string;
   fileUrl: string;
   uploadedAt: string;
};

function KnowledgeBaseEmptyState() {
   return (
      <div className="text-center py-8 text-muted-foreground">
         <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
         <p>{translate("pages.competitor-details.knowledge-base.no-files")}</p>
         <p className="text-sm">
            {translate(
               "pages.competitor-details.knowledge-base.no-files-description",
            )}
         </p>
      </div>
   );
}

export function CompetitorDetailsKnowledgeBaseCard({
   competitor,
}: {
   competitor: CompetitorSelect;
}) {
   const { id } = useParams({ from: "/_dashboard/competitors/$id" });
   const queryClient = useQueryClient();
   const trpc = useTRPC();
   const { open, Modal } = CompetitorFileViewerModal();

   const deleteFileMutation = useMutation(
      trpc.competitorFile.delete.mutationOptions({
         onSuccess: async () => {
            toast.success(
               translate(
                  "pages.competitor-details.knowledge-base.messages.delete-success",
               ),
            );
            await queryClient.invalidateQueries({
               queryKey: trpc.competitor.get.queryKey({ id }),
            });
         },
         onError: () => {
            toast.error(
               translate(
                  "pages.competitor-details.knowledge-base.messages.delete-error",
               ),
            );
         },
      }),
   );

   const handleDeleteFile = useCallback(
      async (fileName: string) => {
         const fileToDelete = competitor?.uploadedFiles?.find(
            (f: UploadedFile) => f.fileName === fileName,
         );
         if (fileToDelete) {
            await deleteFileMutation.mutateAsync({
               competitorId: id,
               fileName: fileName,
            });
         }
      },
      [competitor, id, deleteFileMutation],
   );

   const handleViewFile = useCallback(
      (fileName: string) => {
         open(fileName);
      },
      [open],
   );

   const uploadedFiles = useMemo(
      () => competitor.uploadedFiles || [],
      [competitor.uploadedFiles],
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
                  {translate("pages.competitor-details.knowledge-base.title")}
               </CardTitle>
               <CardDescription>
                  {translate(
                     "pages.competitor-details.knowledge-base.description",
                  )}
               </CardDescription>
               <CardAction>
                  {competitor.analysisStatus === "completed" && (
                     <Badge className="font-semibold">
                        {translate(
                           "pages.competitor-details.knowledge-base.indexed-badge",
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
                                 "pages.competitor-details.knowledge-base.uploaded-on",
                                 {
                                    date: new Date(
                                       file.uploadedAt,
                                    ).toLocaleDateString(),
                                 },
                              )}
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
                              {translate(
                                 "pages.competitor-details.knowledge-base.actions.view",
                              )}
                           </DropdownMenuItem>
                           <DropdownMenuItem
                              onSelect={() => handleDeleteFile(file.fileName)}
                           >
                              {translate(
                                 "pages.competitor-details.knowledge-base.actions.delete",
                              )}
                           </DropdownMenuItem>
                        </DropdownMenuContent>
                     </DropdownMenu>
                  </div>
               ))}
               {uploadedFiles.length === 0 && <KnowledgeBaseEmptyState />}
            </CardContent>
            <CardFooter className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
               <span>
                  {translate(
                     "pages.competitor-details.knowledge-base.files-count",
                     {
                        current: uploadedFiles.length,
                        total: AGENT_FILE_UPLOAD_LIMIT,
                     },
                  )}
               </span>
               <span>
                  {canAddMore
                     ? translate(
                          "pages.competitor-details.knowledge-base.remaining-files",
                          {
                             count: remainingSlots,
                             plural: remainingSlots > 1 ? "s" : "",
                          },
                       )
                     : translate(
                          "pages.competitor-details.knowledge-base.upload-limit-reached",
                       )}
               </span>
            </CardFooter>
         </Card>
         <Modal />
      </>
   );
}
