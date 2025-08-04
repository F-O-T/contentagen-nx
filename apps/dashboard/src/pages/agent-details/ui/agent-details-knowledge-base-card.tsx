import { Button } from "@packages/ui/components/button";
import { Input } from "@packages/ui/components/input";
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
   CardFooter,
   CardAction,
} from "@packages/ui/components/card";
import { Badge } from "@packages/ui/components/badge";
import {
   DropdownMenu,
   DropdownMenuTrigger,
   DropdownMenuContent,
   DropdownMenuItem,
} from "@packages/ui/components/dropdown-menu";
import { Upload, FileText, MoreHorizontal } from "lucide-react";
import useFileUpload, { type UploadedFile } from "../lib/use-file-upload";
import { useState, useEffect } from "react";
// import { useTRPC } from "@/integrations/clients";
import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogFooter,
} from "@packages/ui/components/dialog";
import { useAppForm } from "@packages/ui/components/form";

const FILE_UPLOAD_LIMIT = 5;

function KnowledgeBaseEmptyState() {
   return (
      <div className="text-center py-8 text-muted-foreground">
         <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
         <p>No brand files yet</p>
         <p className="text-sm">
            Upload Markdown files with your brand’s values, voice, or
            guidelines.
         </p>
      </div>
   );
}

export interface AgentDetailsKnowledgeBaseCardProps {
   uploadedFiles: UploadedFile[];
   onViewFile: (fileName: string, fileUrl: string) => void;

   agentId: string;
}

export function AgentDetailsKnowledgeBaseCard({
   uploadedFiles,
   onViewFile,

   // agentId,
}: AgentDetailsKnowledgeBaseCardProps) {
   const [isClient, setIsClient] = useState(false);
   useEffect(() => {
      setIsClient(true);
   }, []);

   // const trpc = useTRPC();
   const {
      fileInputRef,
      handleFileSelect,
      handleButtonClick,
      handleDeleteFile,
      canAddMore,
      remainingSlots,
   } = useFileUpload(uploadedFiles, { fileLimit: FILE_UPLOAD_LIMIT });

   // Dialog state for website URL
   const [showWebsiteDialog, setShowWebsiteDialog] = useState(false);

   // TanStack Form for website URL
   const websiteForm = useAppForm({
      defaultValues: { websiteUrl: "" },
   });

   return (
      <>
         <Dialog open={showWebsiteDialog} onOpenChange={setShowWebsiteDialog}>
            <DialogContent>
               <DialogHeader>
                  <DialogTitle>Generate Brand Files from Website</DialogTitle>
               </DialogHeader>
               <form onSubmit={websiteForm.handleSubmit}>
                  <Input placeholder="https://yourbrand.com" autoFocus />
                  <DialogFooter className="mt-4">
                     <Button
                        variant="outline"
                        type="button"
                        onClick={() => setShowWebsiteDialog(false)}
                     >
                        Cancel
                     </Button>
                  </DialogFooter>
               </form>
            </DialogContent>
         </Dialog>
         <Card>
            <CardHeader className="">
               <CardTitle>Brand Knowledge</CardTitle>
               <CardDescription>
                  Upload files about your brand for your agent to use.
               </CardDescription>
               <CardAction>
                  <Badge variant="outline">
                     {remainingSlots}/{FILE_UPLOAD_LIMIT}
                  </Badge>
               </CardAction>
            </CardHeader>
            <CardContent>
               {uploadedFiles.length > 0 ? (
                  <div className="space-y-2">
                     {uploadedFiles.map((file, index) => (
                        <div
                           key={`file-${index + 1}`}
                           className="flex items-center justify-between p-4 border rounded-lg "
                        >
                           <div className="flex items-center gap-3">
                              <FileText className="w-4 h-4 text-muted-foreground" />
                              <div>
                                 <p className="font-medium text-sm">
                                    {file.fileName}
                                 </p>
                                 <p className="text-xs text-muted-foreground">
                                    Uploaded{" "}
                                    {isClient
                                       ? new Date(
                                            file.uploadedAt,
                                         ).toLocaleDateString()
                                       : "..."}
                                 </p>
                              </div>
                           </div>
                           <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                 <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex items-center"
                                 >
                                    <MoreHorizontal className="w-4 h-4" />
                                 </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                 <DropdownMenuItem
                                    onSelect={() =>
                                       onViewFile(file.fileName, file.fileUrl)
                                    }
                                 >
                                    View
                                 </DropdownMenuItem>
                                 <DropdownMenuItem
                                    onSelect={() =>
                                       handleDeleteFile(file.fileName)
                                    }
                                 >
                                    Delete
                                 </DropdownMenuItem>
                              </DropdownMenuContent>
                           </DropdownMenu>
                        </div>
                     ))}
                  </div>
               ) : (
                  <KnowledgeBaseEmptyState />
               )}
            </CardContent>
            {/* Hidden file input for uploads */}
            <Input
               ref={fileInputRef}
               type="file"
               accept=".md"
               multiple
               onChange={handleFileSelect}
               className="hidden"
            />
            <CardFooter>
               {canAddMore && (
                  <DropdownMenu>
                     <DropdownMenuTrigger asChild>
                        <Button
                           variant="outline"
                           size="sm"
                           className="w-full flex items-center justify-center gap-2"
                        >
                           <Upload className="w-4 h-4" />
                           Upload or Generate
                        </Button>
                     </DropdownMenuTrigger>
                     <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={handleButtonClick}>
                           Upload Files
                        </DropdownMenuItem>
                        <DropdownMenuItem
                           onSelect={() => setShowWebsiteDialog(true)}
                        >
                           Generate Files with Website URL
                        </DropdownMenuItem>
                     </DropdownMenuContent>
                  </DropdownMenu>
               )}
            </CardFooter>
         </Card>
      </>
   );
}
