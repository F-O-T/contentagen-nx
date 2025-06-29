import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouteContext } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { formatValueToTitleCase } from "@packages/ui/lib/utils";

interface ContentSimilarityData {
  similarity: number;
  category: "success" | "info" | "warning" | "error";
  message: string;
  similarRequests: Array<{
    id: string;
    topic: string;
    briefDescription: string;
    similarity: number;
    status: string;
    createdAt: string;
  }>;
}

export function useContentRequestDetails() {
  const { requestId } = useParams({ from: "/_dashboard/content/requests/$requestId" });
  const { eden } = useRouteContext({ from: "/_dashboard/content/requests/$requestId" });
  const [isExporting, setIsExporting] = useState(false);
  const queryClient = useQueryClient();

  // Fetch request details
  const {
    data: requestData,
    isLoading: isLoadingRequest,
    error: requestError,
  } = useQuery({
    queryKey: ["content-request-details", requestId],
    queryFn:  eden.api.v1.content.request.details({ id: requestId }).get,
  });

  const request = requestData;

  // Fetch content similarity data
  const {
    data: similarityData,
    isLoading: isLoadingSimilarity,
  } = useQuery({
    queryKey: ["content-request-similarity", requestId],
    queryFn: () => eden.api.v1.content.request.similarities({ id: requestId }).get(),
    enabled: !!requestId,
  });

  // Fetch generated content
  const {
    data: contentData,
    isLoading: isLoadingContent,
    error: contentError,
  } = useQuery({
    queryKey: ["generated-content", request?.generatedContentId],
    queryFn: () => eden.api.v1.content.get({ id: request?.generatedContentId! }),
    enabled: !!request?.generatedContentId && request?.status === "approved" && !!request?.isCompleted,
  });

  // Fetch actual content similarity if content is generated
  const {
    data: contentSimilarityData,
    isLoading: isLoadingContentSimilarity,
  } = useQuery({
    queryKey: ["content-similarity", request?.generatedContentId],
    queryFn: () => eden.api.v1.content.request["content-similarity"]({ contentId: request?.generatedContentId! }).get(),
    enabled: !!request?.generatedContentId && request?.status === "approved" && !!request?.isCompleted,
  });

  const similarity = similarityData?.data as ContentSimilarityData | undefined;
  const contentSimilarity = contentSimilarityData?.data as ContentSimilarityData | undefined;
  const content = contentData?.data?.content;

  const handleCopyContent = async () => {
    if (!content?.text) {
      toast.error("No content available to copy");
      return;
    }
    
    try {
      const textToCopy = `# ${request?.topic}\n\n${content.text}`;
      
      await navigator.clipboard.writeText(textToCopy);
      toast.success("Content copied to clipboard!");
    } catch (error) {
      console.error("Copy error:", error);
      toast.error("Failed to copy content");
    }
  };

  const handleExportContent = async (format: "txt" | "md" | "docx") => {
    if (!content?.text) {
      toast.error("No content available to export");
      return;
    }

    setIsExporting(true);
    try {
      let fileContent = "";
      let filename = "";
      let mimeType = "";

      switch (format) {
        case "txt":
          fileContent = content.text;
          filename = `${request?.topic?.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
          mimeType = "text/plain";
          break;
        case "md":
          fileContent = `# ${request?.topic}\n\n${content.text}`;
          filename = `${request?.topic?.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
          mimeType = "text/markdown";
          break;
        case "docx":
          fileContent = `${request?.topic}\n\n${content.text}`;
          filename = `${request?.topic?.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
          mimeType = "text/plain";
          break;
      }

      const blob = new Blob([fileContent], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Content exported as ${format.toUpperCase()}!`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export content");
    } finally {
      setIsExporting(false);
    }
  };

  const handleShareContent = async () => {
    try {
      await navigator.share({
        title: request?.topic,
        text: request?.briefDescription,
        url: window.location.href,
      });
    } catch (error) {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  // Approve request mutation
  const approveMutation = useMutation({
    mutationFn: () => eden.api.v1.content.request.approve({ id: requestId }).post(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-request-details", requestId] });
      queryClient.invalidateQueries({ queryKey: ["content-requests"] });
      toast.success("Content request approved! Content generation has started.");
    },
    onError: (error) => {
      console.error("Approve error:", error);
      toast.error("Failed to approve content request");
    },
  });

  // Reject request mutation
  const rejectMutation = useMutation({
    mutationFn: () => eden.api.v1.content.request.reject({ id: requestId }).post(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-request-details", requestId] });
      queryClient.invalidateQueries({ queryKey: ["content-requests"] });
      toast.success("Content request rejected.");
    },
    onError: (error) => {
      console.error("Reject error:", error);
      toast.error("Failed to reject content request");
    },
  });

  const handleApproveRequest = () => {
    if (window.confirm("Are you sure you want to approve this content request? This will start the content generation process.")) {
      approveMutation.mutate();
    }
  };

  const handleRejectRequest = () => {
    if (window.confirm("Are you sure you want to reject this content request? This action cannot be undone.")) {
      rejectMutation.mutate();
    }
  };

  const canExport = request?.status === "approved" && request?.isCompleted;

  return {
    request,
    content,
    similarity,
    contentSimilarity,
    isLoadingRequest,
    isLoadingContent,
    isLoadingSimilarity,
    isLoadingContentSimilarity,
    requestError,
    contentError,
    isExporting,
    canExport,
    approveMutation,
    rejectMutation,
    handleCopyContent,
    handleExportContent,
    handleShareContent,
    handleApproveRequest,
    handleRejectRequest,
  };
}