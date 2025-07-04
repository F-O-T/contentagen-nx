// apps/dashboard/src/pages/agent-details/lib/use-file-upload.ts

import { useRef } from "react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouteContext } from "@tanstack/react-router";

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
   const { eden } = useRouteContext({ from: "/_dashboard/agents/$agentId/" });
   const fileLimit = options?.fileLimit ?? 5;

   // Delete file mutation
   const deleteFileMutation = useMutation({
      mutationFn: async (filename: string) => {
         const response = await eden.api.v1
            .agents({ id: agentId })
            .files({ filename })
            .delete();

         if (response.error) {
            throw new Error("Delete failed");
         }

         return response.data;
      },
      onSuccess: () => {
         toast.success("File deleted successfully!");
         queryClient.invalidateQueries({ queryKey: ["agent", agentId] });
      },
      onError: () => {
         toast.error("Failed to delete file");
      },
   });

   // Upload file mutation
   const uploadFileMutation = useMutation({
      mutationFn: async (file: File) => {
         const { data, error } = await eden.api.v1
            .agents({ id: agentId })
            .upload.post({ file });
         if (error) {
            throw new Error("Upload failed");
         }
         return data.file;
      },
      onError: (_err: unknown, file: File) => {
         console.error("File upload error:", _err);
         toast.error(`Failed to upload ${file.name}`);
      },
   });

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
            const uploadedFile = await uploadFileMutation.mutateAsync(file);
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
         const filename = fileToDelete.fileUrl.split("/").pop();
         if (filename) {
            await deleteFileMutation.mutateAsync(filename);
         }
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
