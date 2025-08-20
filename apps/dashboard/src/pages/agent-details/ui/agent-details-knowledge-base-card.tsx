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
import {
   Credenza,
   CredenzaContent,
   CredenzaHeader,
   CredenzaTitle,
   CredenzaFooter,
   CredenzaClose,
} from "@packages/ui/components/credenza";
import {
   Dropzone,
   DropzoneEmptyState,
   DropzoneContent,
} from "@packages/ui/components/dropzone";
import { GenerateBrandFilesCredenza } from "../features/dynamic-brand-files";

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
      handleDeleteFile,
      canAddMore,
      remainingSlots,
   } = useFileUpload(uploadedFiles, { fileLimit: FILE_UPLOAD_LIMIT });

   // Handler to delete all files
   async function handleDeleteAllFiles() {
      // Call handleDeleteFile for each file
      await Promise.all(
         uploadedFiles.map((file) => handleDeleteFile(file.fileName)),
      );
   }

   // Separate Credenza states
   const [showUploadCredenza, setShowUploadCredenza] = useState(false);
   const [showGenerateCredenza, setShowGenerateCredenza] = useState(false);

   function UploadBrandFilesCredenza({
      open,
      onOpenChange,
   }: {
      open: boolean;
      onOpenChange: (open: boolean) => void;
   }) {
      const FILE_UPLOAD_LIMIT = 5;
      const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
      const [error, setError] = useState<string | null>(null);

      const handleFileSelect = (
         e: React.ChangeEvent<HTMLInputElement> | { target: { files: File[] } },
      ) => {
         const files: File[] =
            "target" in e && e.target.files ? Array.from(e.target.files) : [];
         if (!files.length) return;
         if (uploadedFiles.length + files.length > FILE_UPLOAD_LIMIT) {
            setError(`You can upload up to ${FILE_UPLOAD_LIMIT} files.`);
            return;
         }
         const newFiles = files.map((file) => ({
            fileName: file.name,
            fileUrl: URL.createObjectURL(file),
            uploadedAt: new Date().toISOString(),
         }));
         setUploadedFiles((prev) => [...prev, ...newFiles]);
         setError(null);
      };

      return (
         <Credenza open={open} onOpenChange={onOpenChange}>
            <CredenzaContent>
               <CredenzaHeader>
                  <CredenzaTitle>Upload Brand Files</CredenzaTitle>
               </CredenzaHeader>
               <Dropzone
                  accept={{ "text/markdown": [".md"] }}
                  maxFiles={FILE_UPLOAD_LIMIT}
                  onDrop={(acceptedFiles: File[]) =>
                     handleFileSelect({ target: { files: acceptedFiles } })
                  }
               >
                  <DropzoneEmptyState>
                     <div className="flex flex-col items-center justify-center py-8">
                        <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                           Drag and drop or click to upload Markdown files
                        </span>
                     </div>
                  </DropzoneEmptyState>
                  <DropzoneContent />
               </Dropzone>
               {error && (
                  <div className="text-xs text-red-500 mt-2">{error}</div>
               )}
               <div className="text-xs text-muted-foreground mt-2">
                  Upload Markdown files with your brand’s values, voice, or
                  guidelines.
               </div>
               <div className="mt-4 space-y-2">
                  {uploadedFiles.length > 0 &&
                     uploadedFiles.map((file) => (
                        <div
                           key={file.fileName}
                           className="flex items-center gap-2"
                        >
                           <FileText className="w-4 h-4 text-muted-foreground" />
                           <span className="text-xs">{file.fileName}</span>
                        </div>
                     ))}
               </div>
               <CredenzaFooter className="mt-4">
                  <CredenzaClose asChild>
                     <Button variant="outline" type="button">
                        Close
                     </Button>
                  </CredenzaClose>
               </CredenzaFooter>
            </CredenzaContent>
         </Credenza>
      );
   }

   // Generate Brand Files from Website Credenza (self-contained version)

   return (
      <Card className="h-full">
         <CardHeader className="">
            <CardTitle>Brand Knowledge</CardTitle>
            <CardDescription>
               Upload files about your brand for your agent to use.
            </CardDescription>
            <CardAction>
               <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                     <Button
                        variant={"ghost"}
                        size="icon"
                        className="flex items-center justify-center"
                     >
                        <MoreHorizontal className="w-5 h-5" />
                     </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                     {canAddMore ? (
                        <>
                           <DropdownMenuItem
                              onSelect={() => {
                                 setShowUploadCredenza(true);
                              }}
                           >
                              Upload Files
                           </DropdownMenuItem>
                           <DropdownMenuItem
                              onSelect={() => {
                                 setShowGenerateCredenza(true);
                              }}
                           >
                              Generate from Website
                           </DropdownMenuItem>
                        </>
                     ) : (
                        <DropdownMenuItem onSelect={handleDeleteAllFiles}>
                           Delete All Files
                        </DropdownMenuItem>
                     )}
                  </DropdownMenuContent>
               </DropdownMenu>
            </CardAction>
         </CardHeader>
         <CardContent className="h-full">
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
         <CardFooter className="flex items-center gap-2 text-muted-foreground">
            <span className="text-xs">
               {uploadedFiles.length > 0
                  ? `${uploadedFiles.length} of ${FILE_UPLOAD_LIMIT} file${FILE_UPLOAD_LIMIT > 1 ? "s" : ""} uploaded.`
                  : `No files uploaded yet.`}
            </span>
            <Badge variant="outline">
               {uploadedFiles.length}/{FILE_UPLOAD_LIMIT}
            </Badge>
            <span className="ml-auto text-xs">
               {canAddMore
                  ? `You can upload ${remainingSlots} more file${remainingSlots > 1 ? "s" : ""}.`
                  : `Upload limit reached.`}
            </span>
         </CardFooter>
         {/* Credenza for file upload */}
         <UploadBrandFilesCredenza
            open={showUploadCredenza}
            onOpenChange={setShowUploadCredenza}
         />
         {/* Credenza for website generation */}
         <GenerateBrandFilesCredenza
            open={showGenerateCredenza}
            onOpenChange={setShowGenerateCredenza}
         />
      </Card>
   );
}
