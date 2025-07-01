// apps/dashboard/src/pages/agent-details/lib/use-agent-details.ts

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouteContext } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { toast } from "sonner";

interface SelectedFile {
  file: File;
  id: string;
}

export default function useAgentDetails() {
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [isViewerOpen, setIsViewerOpen] = useState<boolean>(false);
  const [viewingFileContent, setViewingFileContent] = useState<string>("");
  const [viewingFileName, setViewingFileName] = useState<string>("");
  const [isLoadingContent, setIsLoadingContent] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Get agentId from URL params
  const { agentId } = useParams({ from: "/_dashboard/agents/$agentId/" });
  const { eden } = useRouteContext({ from: "/_dashboard/agents/$agentId/" });

  // Fetch agent data
  const { data: agentData, isLoading } = useQuery({
    queryKey: ["agent", agentId],
    queryFn: async () => {
      const response = await eden.api.v1.agents({ id: agentId }).get();
      return response.data;
    },
    enabled: !!agentId,
  });

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

  const agent = agentData?.agent;
  const uploadedFiles = agent?.uploadedFiles || [];

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
    const totalFiles = selectedFiles.length + files.length;
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

  const handleViewFile = async (fileName: string, fileUrl: string) => {
    setIsLoadingContent(true);
    setViewingFileName(fileName);
    setIsViewerOpen(true);

    try {
      // Extract filename from the proxy URL or construct it from fileName
      const urlFileName = fileUrl.split("/").pop() || fileName;

      const response = await eden.api.v1
        .files({ filename: urlFileName })
        .get();
      if (response.error) {
        throw new Error("Failed to fetch file content");
      }
      setViewingFileContent(response.data as unknown as string);
    } catch (error) {
      toast.error("Failed to load file content");
      setViewingFileContent(
        "Failed to load file content. Please try again.",
      );
    } finally {
      setIsLoadingContent(false);
    }
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

  const handleCloseViewer = () => {
    setIsViewerOpen(false);
    setViewingFileContent("");
    setViewingFileName("");
    setIsLoadingContent(false);
  };

  const totalUploadedFiles = uploadedFiles.length;
  const canAddMore = selectedFiles.length + totalUploadedFiles < 3;
  const remainingSlots = 3 - totalUploadedFiles - selectedFiles.length;

  return {
    agent,
    isLoading,
    uploadedFiles,
    selectedFiles,
    setSelectedFiles,
    isViewerOpen,
    setIsViewerOpen,
    viewingFileContent,
    setViewingFileContent,
    viewingFileName,
    setViewingFileName,
    isLoadingContent,
    setIsLoadingContent,
    fileInputRef,
    handleFileSelect,
    handleButtonClick,
    handleViewFile,
    handleDeleteFile,
    handleCloseViewer,
    canAddMore,
    remainingSlots,
    totalUploadedFiles,
  };
}