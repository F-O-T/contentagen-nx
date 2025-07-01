// apps/dashboard/src/pages/agent-details/lib/use-file-upload.ts

import { useRef, useState } from "react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouteContext } from "@tanstack/react-router";

interface SelectedFile {
  file: File;
  id: string;
}

export default function useFileUpload(uploadedFiles: any[]) {
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Get agentId from URL params
  const { agentId } = useParams({ from: "/_dashboard/agents/$agentId/" });
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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);

    // Check if any files are not .md files
    const invalidFiles = files.filter(
      (file) => !file.name.toLowerCase().endsWith(".md"),
    );
    if (invalidFiles.length > 0) {
      // Only Markdown (.md) files are allowed.
      return;
    }

    // Check if adding these files would exceed the limit
    const totalFiles = selectedFiles.length + files.length + (uploadedFiles?.length || 0);
    if (totalFiles > 3) {
      // Maximum 3 files allowed.
      return;
    }

    // Add valid files
    const newFiles: SelectedFile[] = files.map((file) => ({
      file,
      id: `${file.name}-${Date.now()}-${Math.random()}`,
    }));

    setSelectedFiles((prev) => [...prev, ...newFiles]);

    // Clear the input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleDeleteFile = async (fileName: string) => {
    const fileToDelete = uploadedFiles.find((f: any) => f.fileName === fileName);
    if (fileToDelete) {
      const filename = fileToDelete.fileUrl.split("/").pop();
      if (filename) {
        await deleteFileMutation.mutateAsync(filename);
      }
    }
  };

  const canAddMore = selectedFiles.length + (uploadedFiles?.length || 0) < 3;
  const remainingSlots = 3 - (uploadedFiles?.length || 0) - selectedFiles.length;

  return {
    selectedFiles,
    setSelectedFiles,
    fileInputRef,
    handleFileSelect,
    handleButtonClick,
    handleDeleteFile,
    canAddMore,
    remainingSlots,
  };
}