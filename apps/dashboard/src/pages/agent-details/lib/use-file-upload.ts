// apps/dashboard/src/pages/agent-details/lib/use-file-upload.ts

import { useRef, useState } from "react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouteContext } from "@tanstack/react-router";

export type UploadedFile = {
   fileName: string;
   fileUrl: string;
   uploadedAt: string;
};
interface SelectedFile {
   file: File;
   id: string;
}

export interface UseFileUploadOptions {
   onUploadComplete?: (newFiles: UploadedFile[]) => void;
}

export default function useFileUpload(
   uploadedFiles: UploadedFile[],
   options?: UseFileUploadOptions,
) {
   const { agentId } = useParams({ from: "/_dashboard/agents/$agentId/" });
   const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
   const [uploading, setUploading] = useState(false);
   const fileInputRef = useRef<HTMLInputElement>(null);
   const queryClient = useQueryClient();
   const { eden } = useRouteContext({ from: "/_dashboard/agents/$agentId/" });

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
      const totalFiles =
         selectedFiles.length + files.length + (uploadedFiles?.length || 0);
      if (totalFiles > 3) {
         toast.error("Maximum 3 files allowed.");
         return;
      }

      setUploading(true);

      const uploaded: UploadedFile[] = [];
      for (const file of files) {
         try {
            const formData = new FormData();
            formData.append("file", file);

            const { data, error } = await eden.api.v1
               .agents({ id: agentId })
               .upload.post({
                  file,
               });
            if (error) {
               throw new Error("Upload failed");
            }

            if (data) {
               uploaded.push(data.file);
            }
         } catch (err) {
            console.error("File upload error:", err);
            toast.error(`Failed to upload ${file.name}`);
         }
      }

      setUploading(false);

      if (uploaded.length > 0) {
         options?.onUploadComplete?.(uploaded);
         toast.success(`${uploaded.length} file(s) uploaded successfully.`);
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

   const canAddMore = selectedFiles.length + (uploadedFiles?.length || 0) < 3;
   const remainingSlots =
      3 - (uploadedFiles?.length || 0) - selectedFiles.length;

   return {
      selectedFiles,
      setSelectedFiles,
      fileInputRef,
      handleFileSelect,
      handleButtonClick,
      handleDeleteFile,
      canAddMore,
      remainingSlots,
      uploading,
   };
}
