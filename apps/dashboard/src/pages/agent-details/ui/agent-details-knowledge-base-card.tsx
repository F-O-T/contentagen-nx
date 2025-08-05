import { z } from "zod";

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
   Credenza,
   CredenzaContent,
   CredenzaHeader,
   CredenzaTitle,
   CredenzaFooter,
   CredenzaClose,
} from "@packages/ui/components/credenza";
import { useAppForm } from "@packages/ui/components/form";
import {
   Dropzone,
   DropzoneEmptyState,
   DropzoneContent,
} from "@packages/ui/components/dropzone";

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

   // Separate Credenza states
   const [showUploadCredenza, setShowUploadCredenza] = useState(false);
   const [showGenerateCredenza, setShowGenerateCredenza] = useState(false);

   // TanStack Form for website URL (with zod validation)
   const websiteSchema = z.object({
      websiteUrl: z.string().url("Please enter a valid URL"),
   });
   useAppForm({
      defaultValues: { websiteUrl: "" },
      validators: { onBlur: websiteSchema },
      onSubmit: async ({ formApi }) => {
         // TODO: implement your generate logic here
         formApi.reset();
      },
   });

   // Upload Brand Files Credenza (self-contained version)
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
   function GenerateBrandFilesCredenza({
      open,
      onOpenChange,
      onGenerate,
   }: {
      open: boolean;
      onOpenChange: (open: boolean) => void;
      onGenerate?: (websiteUrl: string) => void;
   }) {
      const [websiteUrl, setWebsiteUrl] = useState("");
      const [error, setError] = useState<string | null>(null);
      const [isSubmitting, setIsSubmitting] = useState(false);
      const urlSchema = z.string().url("Please enter a valid URL");

      const handleSubmit = async (e: React.FormEvent) => {
         e.preventDefault();
         setError(null);
         try {
            urlSchema.parse(websiteUrl);
            setIsSubmitting(true);
            if (onGenerate) onGenerate(websiteUrl);
            setIsSubmitting(false);
            setWebsiteUrl("");
            onOpenChange(false);
         } catch (err: any) {
            setError(err.message || "Invalid URL");
         }
      };

      return (
         <Credenza open={open} onOpenChange={onOpenChange}>
            <CredenzaContent>
               <CredenzaHeader>
                  <CredenzaTitle>
                     Generate Brand Files from Website
                  </CredenzaTitle>
               </CredenzaHeader>
               <form onSubmit={handleSubmit}>
                  <div className="mb-2">
                     <Input
                        autoFocus
                        name="websiteUrl"
                        placeholder="https://yourbrand.com"
                        value={websiteUrl}
                        type="url"
                        onChange={(e) => setWebsiteUrl(e.target.value)}
                     />
                  </div>
                  {error && (
                     <div className="text-xs text-red-500 mb-2">{error}</div>
                  )}
                  <CredenzaFooter className="mt-4">
                     <CredenzaClose asChild>
                        <Button variant="outline" type="button">
                           Cancel
                        </Button>
                     </CredenzaClose>
                     <Button
                        type="submit"
                        disabled={isSubmitting || !websiteUrl}
                     >
                        Generate
                     </Button>
                  </CredenzaFooter>
               </form>
            </CredenzaContent>
         </Credenza>
      );
   }

   return (
      <Card className="h-full">
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
                  </DropdownMenuContent>
               </DropdownMenu>
            )}
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
