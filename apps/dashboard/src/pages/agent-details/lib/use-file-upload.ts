// apps/dashboard/src/pages/agent-details/lib/use-file-upload.ts

import { useRef } from "react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { useTRPC } from "@/integrations/clients";

export type UploadedFile = {
   fileName: string;
   fileUrl: string;
   uploadedAt: string;
};

export interface UseFileUploadOptions {
   onUploadComplete?: (newFiles: UploadedFile[]) => void;
   fileLimit?: number;
}

export default function useFileUpload(
   uploadedFiles: UploadedFile[],
   options?: UseFileUploadOptions,
) {
   const { agentId } = useParams({ from: "/_dashboard/agents/$agentId/" });
   const fileInputRef = useRef<HTMLInputElement>(null);
   const queryClient = useQueryClient();
   const trpc = useTRPC();
   const fileLimit = options?.fileLimit ?? 5;

   // Delete file mutation
   const deleteFileMutation = useMutation(
      trpc.agentFile.delete.mutationOptions({
         onSuccess: async () => {
            toast.success("File deleted successfully!");
            await queryClient.invalidateQueries({
               queryKey: trpc.agent.get.queryKey({ id: agentId }),
            });
         },
         onError: () => {
            toast.error("Failed to delete file");
         },
      }),
   );

   // Upload file mutation
   const uploadFileMutation = useMutation(
      trpc.agentFile.upload.mutationOptions({
         onSuccess: () => {
            toast.success("File uploaded successfully!");
            queryClient.invalidateQueries({
               queryKey: trpc.agent.get.queryKey({ id: agentId }),
            });
         },
         onError: (_err: unknown, variables) => {
            const file = variables as { fileName: string };
            console.error("File upload error:", _err);
            toast.error(`Failed to upload ${file.fileName}`);
         },
      }),
   );

   async function uploadFile(file: File) {
      // Convert file to base64 for TRPC
      const buffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(buffer);
      const binary = String.fromCharCode(...uint8Array);
      const base64 = btoa(binary);
      const result = await uploadFileMutation.mutateAsync({
         agentId,
         fileName: file.name,
         fileBuffer: base64,
         contentType: file.type || "text/markdown",
      });

      return {
         fileName: file.name,
         fileUrl: result.url,
         uploadedAt: new Date().toISOString(),
      };
   }

   const handleFileSelect = async (
      event: React.ChangeEvent<HTMLInputElement>,
   ) => {
      const files = Array.from(event.target.files || []);

      // Check if any files are not .md files
      const invalidFiles = files.filter(
         (file) => !file.name.toLowerCase().endsWith(".md"),
      );
      if (invalidFiles.length > 0) {
         toast.error("Only Markdown (.md) files are allowed.");
         return;
      }

      // Check if adding these files would exceed the limit
      const totalFiles = uploadedFiles.length + files.length;
      if (totalFiles > fileLimit) {
         toast.error(`Maximum ${fileLimit} files allowed.`);
         return;
      }

      toast.info("Uploading file(s)...");

      const uploaded: UploadedFile[] = [];
      for (const file of files) {
         try {
            const uploadedFile = await uploadFile(file);
            if (uploadedFile) {
               uploaded.push(uploadedFile);
            }
         } catch {
            // Error handled in mutation's onError
         }
      }

      if (uploaded.length > 0) {
         options?.onUploadComplete?.(uploaded);
         toast.success(
            `${uploaded.length} file(s) uploaded successfully and sent for knowledge chunk processing!`,
         );
         queryClient.invalidateQueries({ queryKey: ["agent", agentId] });
      }

      // Clear the input
      if (fileInputRef.current) {
         fileInputRef.current.value = "";
      }
   };

   const handleButtonClick = () => {
      fileInputRef.current?.click();
   };

   const handleDeleteFile = async (fileName: string) => {
      const fileToDelete = uploadedFiles.find(
         (f: UploadedFile) => f.fileName === fileName,
      );
      if (fileToDelete) {
         await deleteFileMutation.mutateAsync({
            agentId,
            fileName: fileName,
         });
      }
   };

   const canAddMore = uploadedFiles.length < fileLimit;
   const remainingSlots = fileLimit - uploadedFiles.length;

   return {
      fileInputRef,
      handleFileSelect,
      handleButtonClick,
      handleDeleteFile,
      canAddMore,
      remainingSlots,
   };
}
