import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouteContext } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

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
    queryFn: () => eden.api.v1.content.request.details({ id: requestId }).get(),
  });

  const request = requestData?.data?.request;

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
    queryFn: async () => await eden.api.v1.content.request.details({ id: request?.generatedContentId! }).get(),
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
  const content = contentData?.data?.request?.generatedContent;

  const handleCopyContent = async () => {
    if (!content?.body) {
      toast.error("No content available to copy");
      return;
    }
    
    try {
      const textToCopy = request?.topic 
        ? `# ${request.topic}\n\n${content.body}`
        : content.body;
      
      await navigator.clipboard.writeText(textToCopy);
      toast.success("Content copied to clipboard!");
    } catch (error) {
      console.error("Copy error:", error);
      toast.error("Failed to copy content. Please try again or copy manually.");
    }
  };

  const handleExportContent = async (format: "txt" | "md" | "docx") => {
    if (!content?.body) {
      toast.error("No content available to export");
      return;
    }

    if (!request?.topic) {
      toast.error("No topic available for filename");
      return;
    }

    setIsExporting(true);
    try {
      let fileContent = "";
      let filename = "";
      let mimeType = "";

      // Create a safe filename from the topic
      const safeTopicName = request.topic.replace(/[^a-z0-9\s-]/gi, '').replace(/\s+/g, '_').toLowerCase();

      switch (format) {
        case "txt":
          fileContent = content.body;
          filename = `${safeTopicName}.txt`;
          mimeType = "text/plain";
          break;
        case "md":
          fileContent = `# ${request.topic}\n\n${content.body}`;
          filename = `${safeTopicName}.md`;
          mimeType = "text/markdown";
          break;
        case "docx":
          // For docx, we'll create a simple text format for now
          // In a real implementation, you'd want to use a library like docx or mammoth
          fileContent = `${request.topic}\n${'='.repeat(request.topic.length)}\n\n${content.body}`;
          filename = `${safeTopicName}.docx`;
          mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
          break;
      }

      const blob = new Blob([fileContent], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);

      toast.success(`Content exported as ${format.toUpperCase()}!`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export content");
    } finally {
      setIsExporting(false);
    }
  };

  const handleShareContent = async () => {
    if (!request?.topic && !request?.briefDescription) {
      toast.error("No content information available to share");
      return;
    }

    try {
      // Check if Web Share API is supported
      if (navigator.share) {
        await navigator.share({
          title: request?.topic || "Content Request",
          text: request?.briefDescription || "Check out this content request",
          url: window.location.href,
        });
        toast.success("Content shared successfully!");
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied to clipboard!");
      }
    } catch (error) {
      console.error("Share error:", error);
      // Fallback to clipboard if sharing fails
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied to clipboard!");
      } catch (clipboardError) {
        console.error("Clipboard error:", clipboardError);
        toast.error("Failed to share content. Please copy the URL manually.");
      }
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