import { Button } from "@packages/ui/components/button";
import { Input } from "@packages/ui/components/input";
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
   CardFooter,
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
import { useState } from "react";
import { useEden } from "@/integrations/eden";

const FILE_UPLOAD_LIMIT = 5;

export interface AgentDetailsKnowledgeBaseCardProps {
   uploadedFiles: UploadedFile[];
   onViewFile: (fileName: string, fileUrl: string) => void;

   agentId: string;
}

export function AgentDetailsKnowledgeBaseCard({
   uploadedFiles,
   onViewFile,

   agentId,
}: AgentDetailsKnowledgeBaseCardProps) {
   const { eden } = useEden();
   const {
      fileInputRef,
      handleFileSelect,
      handleButtonClick,
      handleDeleteFile,
      canAddMore,
      remainingSlots,
   } = useFileUpload(uploadedFiles, { fileLimit: FILE_UPLOAD_LIMIT });

   // New: Website link input state
   const [websiteUrl, setWebsiteUrl] = useState("");
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [submitMessage, setSubmitMessage] = useState<string | null>(null);

   async function handleWebsiteSubmit() {
      if (!websiteUrl || !agentId) return;
      setIsSubmitting(true);
      setSubmitMessage(null);
      try {
         // Use Eden to call backend API
         const res = await eden.api.v1.agents["brand-website"].post({
            url: websiteUrl,
            agentId,
         });
         if (!res.error) {
            setSubmitMessage("Brand website knowledge extracted and saved!");
            setWebsiteUrl("");
         } else {
            setSubmitMessage("Failed to extract brand knowledge.");
         }
      } catch (err) {
         console.error("Error extracting brand knowledge:", err);
         setSubmitMessage("Error connecting to backend.");
      }
      setIsSubmitting(false);
   }

   return (
      <Card>
         <CardHeader className="flex items-center justify-between">
            <div>
               <CardTitle>Brand Knowledge</CardTitle>
               <CardDescription>
                  Upload files about your brand for your agent to use.
                  <br />
                  Or enter your brand website link to auto-extract product and
                  brand info.
               </CardDescription>
            </div>
            <div className="flex items-center">
               <Badge variant="outline">
                  {remainingSlots}/{FILE_UPLOAD_LIMIT}
               </Badge>
            </div>
         </CardHeader>
         <CardContent>
            {/* New: Website link input */}
            <div className="mb-4 flex gap-2 items-center">
               <Input
                  type="url"
                  placeholder="Enter brand website URL"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full"
               />
               <Button
                  variant="outline"
                  size="sm"
                  disabled={isSubmitting || !websiteUrl}
                  onClick={handleWebsiteSubmit}
               >
                  {isSubmitting ? "Extracting..." : "Extract Brand Info"}
               </Button>
            </div>
            {submitMessage && (
               <div className="text-sm text-muted-foreground mb-2">
                  {submitMessage}
               </div>
            )}
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
                                 {new Date(
                                    file.uploadedAt,
                                 ).toLocaleDateString()}
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
               <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No brand files yet</p>
                  <p className="text-sm">
                     Upload Markdown files with your brand’s values, voice, or
                     guidelines.
                  </p>
               </div>
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
               <Button
                  variant="outline"
                  size="sm"
                  className="w-full flex items-center justify-center gap-2"
                  onClick={handleButtonClick}
               >
                  <Upload className="w-4 h-4" />
                  Upload Files
               </Button>
            )}
         </CardFooter>
      </Card>
   );
}
