import { useState, useRef } from "react";
import { useTRPC } from "@/integrations/clients";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { Button } from "@packages/ui/components/button";
import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
} from "@packages/ui/components/dialog";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";

interface CompetitorLogoUploadDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   currentLogo?: string;
}

export function CompetitorLogoUploadDialog({
   open,
   onOpenChange,
   currentLogo,
}: CompetitorLogoUploadDialogProps) {
   const trpc = useTRPC();
   const { id } = useParams({ from: "/_dashboard/competitors/$id" });
   const queryClient = useQueryClient();
   const fileInputRef = useRef<HTMLInputElement>(null);
   const [selectedFile, setSelectedFile] = useState<File | null>(null);
   const [previewUrl, setPreviewUrl] = useState<string | null>(null);

   const uploadLogoMutation = useMutation(
      trpc.competitorFile.uploadLogo.mutationOptions({
         onSuccess: () => {
            toast.success("Logo uploaded successfully!");
            queryClient.invalidateQueries({
               queryKey: trpc.competitor.get.queryKey({ id }),
            });
            onOpenChange(false);
            setSelectedFile(null);
            setPreviewUrl(null);
         },
         onError: (error) => {
            toast.error("Failed to upload logo: " + error.message);
         },
      }),
   );

   const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
         // Validate file type
         if (!file.type.startsWith("image/")) {
            toast.error("Please select an image file");
            return;
         }

         // Validate file size (5MB limit)
         if (file.size > 5 * 1024 * 1024) {
            toast.error("File size must be less than 5MB");
            return;
         }

         setSelectedFile(file);
         
         // Create preview
         const reader = new FileReader();
         reader.onload = (e) => {
            setPreviewUrl(e.target?.result as string);
         };
         reader.readAsDataURL(file);
      }
   };

   const handleUpload = async () => {
      if (!selectedFile) return;

      const reader = new FileReader();
      reader.onload = async (e) => {
         const base64 = e.target?.result as string;
         const base64Data = base64.split(",")[1]; // Remove data URL prefix

         await uploadLogoMutation.mutateAsync({
            competitorId: id,
            fileName: selectedFile.name,
            fileBuffer: base64Data,
            contentType: selectedFile.type,
         });
      };
      reader.readAsDataURL(selectedFile);
   };

   const handleRemoveFile = () => {
      setSelectedFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) {
         fileInputRef.current.value = "";
      }
   };

   return (
      <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent className="sm:max-w-md">
            <DialogHeader>
               <DialogTitle>Upload Competitor Logo</DialogTitle>
               <DialogDescription>
                  Upload a logo for this competitor. Supported formats: JPG, PNG, WebP (max 5MB)
               </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
               {/* Current Logo */}
               {currentLogo && (
                  <div className="space-y-2">
                     <label className="text-sm font-medium">Current Logo</label>
                     <div className="flex items-center gap-2 p-2 border rounded">
                        <img
                           src={currentLogo}
                           alt="Current logo"
                           className="w-12 h-12 object-contain"
                        />
                        <span className="text-sm text-muted-foreground truncate">
                           {currentLogo.split("/").pop()}
                        </span>
                     </div>
                  </div>
               )}

               {/* File Upload */}
               <div className="space-y-2">
                  <label className="text-sm font-medium">Select New Logo</label>
                  <input
                     ref={fileInputRef}
                     type="file"
                     accept="image/*"
                     onChange={handleFileSelect}
                     className="hidden"
                  />
                  <Button
                     variant="outline"
                     className="w-full"
                     onClick={() => fileInputRef.current?.click()}
                  >
                     <Upload className="w-4 h-4 mr-2" />
                     Choose File
                  </Button>
               </div>

               {/* Preview */}
               {previewUrl && (
                  <div className="space-y-2">
                     <label className="text-sm font-medium">Preview</label>
                     <div className="flex items-center gap-2 p-2 border rounded">
                        <img
                           src={previewUrl}
                           alt="Preview"
                           className="w-12 h-12 object-contain"
                        />
                        <div className="flex-1">
                           <p className="text-sm font-medium">{selectedFile?.name}</p>
                           <p className="text-xs text-muted-foreground">
                              {selectedFile && `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`}
                           </p>
                        </div>
                        <Button
                           variant="ghost"
                           size="icon"
                           onClick={handleRemoveFile}
                        >
                           <X className="w-4 h-4" />
                        </Button>
                     </div>
                  </div>
               )}
            </div>

            <DialogFooter>
               <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
               </Button>
               <Button
                  onClick={handleUpload}
                  disabled={!selectedFile || uploadLogoMutation.isPending}
               >
                  {uploadLogoMutation.isPending ? "Uploading..." : "Upload Logo"}
               </Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
   );
}