import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouteContext, Link } from "@tanstack/react-router";
import { Button } from "@packages/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@packages/ui/components/card";
import { Badge } from "@packages/ui/components/badge";
import { SimilarityBanner } from "@packages/ui/components/similarity-banner";
import { Separator } from "@packages/ui/components/separator";
import { ArrowLeft, Download, Copy, Share, ExternalLink, Check, X } from "lucide-react";
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

export function ContentRequestDetailsPage() {
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

  const handleCopyContent = async () => {
    if (!request?.generatedContentId) {
      toast.error("No content available to copy");
      return;
    }
    
    try {
      // For now, we'll use placeholder content since there's no direct content endpoint
      // In a real implementation, you'd fetch from your content API
      const content = `# ${request.topic}\n\n${request.briefDescription}\n\n[Generated content would be displayed here based on the target length: ${formatValueToTitleCase(request.targetLength)}]`;
      
      await navigator.clipboard.writeText(content);
      toast.success("Content copied to clipboard!");
    } catch (error) {
      console.error("Copy error:", error);
      toast.error("Failed to copy content");
    }
  };

  const handleExportContent = async (format: "txt" | "md" | "docx") => {
    if (!request?.generatedContentId) {
      toast.error("No content available to export");
      return;
    }

    setIsExporting(true);
    try {
      // For now, we'll use placeholder content since there's no direct content endpoint
      // In a real implementation, you'd fetch from your content API
      const content = `Generated content for: ${request.topic}\n\nBrief Description: ${request.briefDescription}\n\nTarget Length: ${formatValueToTitleCase(request.targetLength)}\n\n[This is where the actual AI-generated content would appear based on your content request.]`;
      
      // Create and download the file based on format
      let fileContent = "";
      let filename = "";
      let mimeType = "";

      switch (format) {
        case "txt":
          fileContent = content;
          filename = `${request.topic.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
          mimeType = "text/plain";
          break;
        case "md":
          fileContent = `# ${request.topic}\n\n${content}`;
          filename = `${request.topic.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
          mimeType = "text/markdown";
          break;
        case "docx":
          // For DOCX, you'd typically use a library like docx or send to backend
          // For now, we'll fall back to plain text
          fileContent = `${request.topic}\n\n${content}`;
          filename = `${request.topic.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
          mimeType = "text/plain";
          break;
      }

      // Create and trigger download
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
      // Fallback to copying URL
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

  if (isLoadingRequest) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (requestError || !request) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h3 className="text-lg font-semibold mb-2">Request Not Found</h3>
            <p className="text-muted-foreground mb-4">
              The content request you're looking for doesn't exist or you don't have access to it.
            </p>
            <Link to="/content">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Requests
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const canExport = request.status === "approved" && request.isCompleted;

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/content">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Requests
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{request.topic}</h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge 
                className={
                  request.status === "approved" 
                    ? "bg-green-100 text-green-800" 
                    : request.status === "pending"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
                }
              >
                {formatValueToTitleCase(request.status)}
              </Badge>
              {request.isCompleted && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  Completed
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {/* Approval Buttons - Only show for pending requests */}
          {request.status === "pending" && (
            <>
              <Button 
                size="sm" 
                onClick={handleApproveRequest}
                disabled={approveMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="h-4 w-4 mr-2" />
                {approveMutation.isPending ? "Approving..." : "Approve Request"}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRejectRequest}
                disabled={rejectMutation.isPending}
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                <X className="h-4 w-4 mr-2" />
                {rejectMutation.isPending ? "Rejecting..." : "Reject Request"}
              </Button>
            </>
          )}

          {/* Export Buttons - Only show for approved and completed requests */}
          {canExport && (
            <>
              <Button variant="outline" size="sm" onClick={handleShareContent}>
                <Share className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm" onClick={handleCopyContent}>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
              <div className="flex gap-1">
                <Button 
                  size="sm" 
                  onClick={() => handleExportContent("txt")}
                  disabled={isExporting}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isExporting ? "Exporting..." : "Export TXT"}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleExportContent("md")}
                  disabled={isExporting}
                >
                  MD
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleExportContent("docx")}
                  disabled={isExporting}
                >
                  DOCX
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Content Similarity Banners */}
      <div className="space-y-3">
        {/* Request Similarity */}
        {similarity && !isLoadingSimilarity && (
          <SimilarityBanner
            similarity={similarity.similarity}
            category={similarity.category}
            message={`Request Similarity: ${similarity.message}`}
          />
        )}
        
        {/* Content Similarity (for generated content) */}
        {contentSimilarity && !isLoadingContentSimilarity && canExport && (
          <SimilarityBanner
            similarity={contentSimilarity.similarity}
            category={contentSimilarity.category}
            message={`Content Similarity: ${contentSimilarity.message}`}
          />
        )}
      </div>

      {/* Request Details */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Request Information */}
          <Card>
            <CardHeader>
              <CardTitle>Request Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Brief Description</h4>
                <p className="text-muted-foreground">{request.briefDescription}</p>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Target Length:</span>
                  <p className="text-muted-foreground mt-1">
                    {formatValueToTitleCase(request.targetLength)}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Agent ID:</span>
                  <p className="text-muted-foreground mt-1 font-mono text-xs">
                    {request.agentId}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Created:</span>
                  <p className="text-muted-foreground mt-1">
                    {new Date(request.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Updated:</span>
                  <p className="text-muted-foreground mt-1">
                    {new Date(request.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Generated Content */}
          {canExport && (
            <Card>
              <CardHeader>
                <CardTitle>Generated Content</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 rounded-lg p-4 min-h-[300px]">
                  <p className="text-muted-foreground">
                    [Generated content would be displayed here. This would be fetched from your content generation system.]
                  </p>
                  <div className="mt-4 p-4 bg-white rounded border">
                    <h3 className="font-semibold mb-2">{request.topic}</h3>
                    <p className="text-sm text-muted-foreground">
                      This is where the AI-generated content based on your request would appear. 
                      The content would be tailored to your specified target length ({formatValueToTitleCase(request.targetLength)}) 
                      and would address the brief description you provided.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Similar Requests */}
          {similarity?.similarRequests && similarity.similarRequests.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Similar Requests</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {similarity.similarRequests.map((similar) => (
                  <div key={similar.id} className="border rounded-lg p-3 hover:bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm line-clamp-1">{similar.topic}</h4>
                      <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                        {Math.round(similar.similarity * 100)}%
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                      {similar.briefDescription}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        {formatValueToTitleCase(similar.status)}
                      </Badge>
                      <span>{new Date(similar.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link to="/agents" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Create Similar Request
                </Button>
              </Link>
              
              {canExport && (
                <Button variant="outline" className="w-full justify-start" onClick={handleCopyContent}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Content
                </Button>
              )}
              
              <Link to="/content" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to All Requests
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
