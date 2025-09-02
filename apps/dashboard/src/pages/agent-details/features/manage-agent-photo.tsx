import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
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

import type { AgentSelect } from "@packages/database/schema";

interface ManageAgentPhotoProps {
   agent: AgentSelect;
   open?: boolean;
   onOpenChange?: (open: boolean) => void;
}

export function ManageAgentPhoto({
   agent: _agent,
   open,
   onOpenChange,
}: ManageAgentPhotoProps) {
   const isControlled = open !== undefined && onOpenChange !== undefined;
   const [internalOpen, setInternalOpen] = useState(false);

   const isOpen = isControlled ? open : internalOpen;
   const setIsOpen = isControlled ? onOpenChange : setInternalOpen;
   const [selectedFile, setSelectedFile] = useState<File | null>(null);
   const [filePreview, setFilePreview] = useState<string | undefined>();
   const { agentId } = useParams({ from: "/_dashboard/agents/$agentId/" });
   const queryClient = useQueryClient();
   const trpc = useTRPC();

   // Fetch the profile photo using the streaming route
   const { data: profilePhotoData } = useQuery(
      trpc.agentFile.getProfilePhoto.queryOptions({
         agentId,
      }),
   );

   // Determine what image to display: new preview, existing photo, or nothing
   const displayImage = filePreview || profilePhotoData?.data;

   const uploadPhotoMutation = useMutation(
      trpc.agentFile.uploadProfilePhoto.mutationOptions({
         onSuccess: async () => {
            toast.success("Profile photo updated successfully!");
            await queryClient.invalidateQueries({
               queryKey: trpc.agent.get.queryKey({ id: agentId }),
            });
            await queryClient.invalidateQueries({
               queryKey: trpc.agentFile.getProfilePhoto.queryKey({ agentId }),
            });
            setIsOpen(false);
            setSelectedFile(null);
            setFilePreview(undefined);
         },
         onError: (error) => {
            console.error("Upload error:", error);
            toast.error("Failed to upload profile photo");
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
         // Convert file to base64 using a more efficient method
         const buffer = await selectedFile.arrayBuffer();
         const uint8Array = new Uint8Array(buffer);

         // Convert Uint8Array to binary string in chunks to avoid argument limit
         let binary = "";
         const chunkSize = 8192; // Process in 8KB chunks
         for (let i = 0; i < uint8Array.length; i += chunkSize) {
            const chunk = uint8Array.slice(i, i + chunkSize);
            binary += String.fromCharCode.apply(null, Array.from(chunk));
         }
         const base64 = btoa(binary);

         await uploadPhotoMutation.mutateAsync({
            agentId,
            fileName: selectedFile.name,
            fileBuffer: base64,
            contentType: selectedFile.type,
         });
      } catch (error) {
         console.error("Upload failed:", error);
         toast.error("Failed to upload photo");
      }
   };

   return (
      <Credenza open={isOpen} onOpenChange={setIsOpen}>
         <CredenzaContent>
            <CredenzaHeader>
               <CredenzaTitle>Manage Agent Photo</CredenzaTitle>
               <CredenzaDescription>
                  Upload a new profile photo for your agent. The image will be
                  displayed in your agent's profile.
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
                  disabled={uploadPhotoMutation.isPending}
                  src={selectedFile ? [selectedFile] : undefined}
               >
                  <DropzoneEmptyState>
                     {profilePhotoData?.data && (
                        <img
                           alt="profile"
                           className="  object-contain"
                           src={profilePhotoData.data}
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
                  disabled={!selectedFile || uploadPhotoMutation.isPending}
               >
                  {uploadPhotoMutation.isPending
                     ? "Uploading..."
                     : "Upload Photo"}
               </Button>
            </CredenzaFooter>
         </CredenzaContent>
      </Credenza>
   );
}
