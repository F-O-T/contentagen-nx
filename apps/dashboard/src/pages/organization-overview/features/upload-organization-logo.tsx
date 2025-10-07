import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/integrations/clients";
import { toast } from "sonner";
import {
   Credenza,
   CredenzaContent,
   CredenzaHeader,
   CredenzaTitle,
   CredenzaDescription,
   CredenzaBody,
   CredenzaFooter,
   CredenzaClose,
} from "@packages/ui/components/credenza";
import {
   Dropzone,
   DropzoneContent,
   DropzoneEmptyState,
} from "@packages/ui/components/dropzone";
import { Button } from "@packages/ui/components/button";
import { Upload } from "lucide-react";

interface UploadOrganizationLogoFeatureProps {
   onUpload?: (data: {
      fileName: string;
      fileBuffer: string;
      contentType: string;
   }) => void;
}

export function UploadOrganizationLogoFeature({
   onUpload,
}: UploadOrganizationLogoFeatureProps) {
   const [dialogOpen, setDialogOpen] = useState(false);
   const [selectedFile, setSelectedFile] = useState<File | null>(null);
   const [filePreview, setFilePreview] = useState<string | undefined>();

   const queryClient = useQueryClient();
   const trpc = useTRPC();

   // Fetch the organization logo using the streaming route
   const { data: logoData } = useQuery(
      trpc.organizationFile.getLogo.queryOptions(),
   );

   // Determine what image to display: new preview, existing logo, or nothing
   const displayImage = filePreview || logoData?.data;

   const uploadLogoMutation = useMutation(
      trpc.organizationFile.uploadLogo.mutationOptions({
         onSuccess: async (data) => {
            toast.success("Organization logo uploaded successfully");
            await queryClient.invalidateQueries({
               queryKey: trpc.organizationFile.getLogo.queryKey(),
            });
            setDialogOpen(false);
            setSelectedFile(null);
            setFilePreview(undefined);
            onUpload?.(data);
         },
         onError: (error) => {
            console.error("Upload error:", error);
            toast.error("Failed to upload organization logo");
         },
      }),
   );

   const handleFileSelect = (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

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

      // Create file preview
      const reader = new FileReader();
      reader.onload = (e) => {
         if (typeof e.target?.result === "string") {
            setFilePreview(e.target.result);
         }
      };
      reader.readAsDataURL(file);
   };

   const handleUpload = async () => {
      if (!selectedFile) return;

      try {
         // Use FileReader for efficient base64 conversion
         const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
               const result = reader.result as string;
               // Remove the data URL prefix to get just the base64
               const base64Data = result.split(",")[1];
               if (!base64Data) {
                  reject(new Error("Failed to extract base64 data"));
                  return;
               }
               resolve(base64Data);
            };
            reader.onerror = reject;
            reader.readAsDataURL(selectedFile);
         });

         const uploadData = {
            fileName: selectedFile.name,
            fileBuffer: base64,
            contentType: selectedFile.type,
         };

         await uploadLogoMutation.mutateAsync(uploadData);
      } catch (error) {
         console.error("Upload failed:", error);
         toast.error("Failed to upload logo");
      }
   };

   return (
      <Credenza open={dialogOpen} onOpenChange={setDialogOpen}>
         <CredenzaContent>
            <CredenzaHeader>
               <CredenzaTitle>Upload Organization Logo</CredenzaTitle>
               <CredenzaDescription>
                  Upload a new logo for your organization
               </CredenzaDescription>
            </CredenzaHeader>
            <CredenzaBody className="space-y-4">
               {/* Dropzone */}
               <Dropzone
                  accept={{
                     "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
                  }}
                  maxSize={5 * 1024 * 1024} // 5MB
                  maxFiles={1}
                  onDrop={handleFileSelect}
                  disabled={uploadLogoMutation.isPending}
                  src={selectedFile ? [selectedFile] : undefined}
               >
                  <DropzoneEmptyState>
                     {logoData?.data && (
                        <img
                           alt="organization logo"
                           className="object-contain"
                           src={logoData.data}
                        />
                     )}
                  </DropzoneEmptyState>
                  <DropzoneContent>
                     {displayImage && (
                        <img
                           alt="Preview"
                           className="h-full w-full object-contain rounded-md"
                           src={displayImage}
                        />
                     )}
                  </DropzoneContent>
               </Dropzone>
            </CredenzaBody>
            <CredenzaFooter className="grid grid-cols-2 gap-2">
               <CredenzaClose asChild>
                  <Button variant="outline">Cancel</Button>
               </CredenzaClose>
               <Button
                  onClick={handleUpload}
                  disabled={!selectedFile || uploadLogoMutation.isPending}
               >
                  {uploadLogoMutation.isPending
                     ? "Uploading..."
                     : "Upload Logo"}
               </Button>
            </CredenzaFooter>
         </CredenzaContent>
      </Credenza>
   );
}

