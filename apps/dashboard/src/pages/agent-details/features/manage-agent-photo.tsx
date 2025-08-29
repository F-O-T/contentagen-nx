import { useState, useMemo, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { useTRPC } from "@/integrations/clients";
import { toast } from "sonner";
import {
   Credenza,
   CredenzaContent,
   CredenzaHeader,
   CredenzaTitle,
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
import {
   Avatar,
   AvatarImage,
   AvatarFallback,
} from "@packages/ui/components/avatar";
import { Upload, X } from "lucide-react";
import type { AgentSelect } from "@packages/database/schema";

interface ManageAgentPhotoProps {
   agent: AgentSelect;
   open?: boolean;
   onOpenChange?: (open: boolean) => void;
}

export function ManageAgentPhoto({
   agent,
   open,
   onOpenChange,
}: ManageAgentPhotoProps) {
   const isControlled = open !== undefined && onOpenChange !== undefined;
   const [internalOpen, setInternalOpen] = useState(false);

   const isOpen = isControlled ? open : internalOpen;
   const setIsOpen = isControlled ? onOpenChange : setInternalOpen;
   const [selectedFile, setSelectedFile] = useState<File | null>(null);
   const { agentId } = useParams({ from: "/_dashboard/agents/$agentId/" });
   const queryClient = useQueryClient();
   const trpc = useTRPC();

   // Query to fetch profile photo data
   const { data: profilePhotoData } = useQuery(
      trpc.agentFile.getProfilePhoto.queryOptions(
         { agentId },
         {
            enabled: !!agent.profilePhotoUrl,
         },
      ),
   );

   // Create preview URL using useMemo for proper lifecycle management
   const previewUrl = useMemo(() => {
      if (!selectedFile) return null;
      return URL.createObjectURL(selectedFile);
   }, [selectedFile]);

   // Cleanup object URL when component unmounts or selectedFile changes
   useEffect(() => {
      return () => {
         if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
         }
      };
   }, [previewUrl]);

   const uploadPhotoMutation = useMutation(
      trpc.agentFile.uploadProfilePhoto.mutationOptions({
         onSuccess: () => {
            toast.success("Profile photo updated successfully!");
            queryClient.invalidateQueries({
               queryKey: trpc.agent.get.queryKey({ id: agentId }),
            });
            setIsOpen(false);
            setSelectedFile(null);
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
   };

   const handleUpload = async () => {
      if (!selectedFile) return;

      try {
         // Convert file to base64
         const buffer = await selectedFile.arrayBuffer();
         const uint8Array = new Uint8Array(buffer);
         const binary = String.fromCharCode(...uint8Array);
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

   const handleRemove = () => {
      if (previewUrl) {
         URL.revokeObjectURL(previewUrl);
      }
      setSelectedFile(null);
   };

   return (
      <Credenza open={isOpen} onOpenChange={setIsOpen}>
         <CredenzaContent className="sm:max-w-md">
            <CredenzaHeader>
               <CredenzaTitle>Manage Agent Photo</CredenzaTitle>
            </CredenzaHeader>
            <CredenzaBody className="space-y-4">
               {/* Current/Preview Photo Display */}
               <div className="flex justify-center">
                  <div className="relative">
                     <Avatar className="w-24 h-24">
                        <AvatarImage
                           src={profilePhotoData?.data}
                           alt={agent.personaConfig.metadata.name}
                        />
                        <AvatarFallback className="text-lg">
                           {agent.personaConfig.metadata.name
                              .charAt(0)
                              .toUpperCase()}
                        </AvatarFallback>
                     </Avatar>
                     {selectedFile && (
                        <Button
                           variant="destructive"
                           size="sm"
                           className="absolute -top-2 -right-2 rounded-full w-6 h-6 p-0"
                           onClick={handleRemove}
                        >
                           <X className="w-3 h-3" />
                        </Button>
                     )}
                  </div>
               </div>

               {/* Dropzone */}
               <Dropzone
                  accept={{
                     "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
                  }}
                  maxSize={5 * 1024 * 1024} // 5MB
                  maxFiles={1}
                  onDrop={handleFileSelect}
                  disabled={uploadPhotoMutation.isPending}
               >
                  <DropzoneContent>
                     {selectedFile ? (
                        <div className="flex flex-col items-center justify-center space-y-2">
                           <Upload className="w-8 h-8 text-muted-foreground" />
                           <p className="text-sm font-medium">
                              {selectedFile.name}
                           </p>
                           <p className="text-xs text-muted-foreground">
                              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                           </p>
                        </div>
                     ) : (
                        <DropzoneEmptyState>
                           <div className="flex flex-col items-center justify-center space-y-2">
                              <Upload className="w-8 h-8 text-muted-foreground" />
                              <p className="text-sm font-medium">
                                 Upload Photo
                              </p>
                              <p className="text-xs text-muted-foreground">
                                 Drag and drop or click to select
                              </p>
                              <p className="text-xs text-muted-foreground">
                                 PNG, JPG, JPEG, GIF, WebP up to 5MB
                              </p>
                           </div>
                        </DropzoneEmptyState>
                     )}
                  </DropzoneContent>
               </Dropzone>
            </CredenzaBody>
            <CredenzaFooter>
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
