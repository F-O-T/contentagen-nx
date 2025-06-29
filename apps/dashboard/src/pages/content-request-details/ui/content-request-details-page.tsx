import { Link } from "@tanstack/react-router";
import { Button } from "@packages/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@packages/ui/components/card";
import { Badge } from "@packages/ui/components/badge";

import { Separator } from "@packages/ui/components/separator";
import { TalkingMascot } from "@/widgets/talking-mascot/ui/talking-mascot";
import { Download, Copy, Share, ExternalLink, Check, X } from "lucide-react";
import { formatValueToTitleCase } from "@packages/ui/lib/utils";

import { useContentRequestDetails } from "../lib/use-content-request-details";

export function ContentRequestDetailsPage() {
  const {
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
  } = useContentRequestDetails();

  if (isLoadingRequest) {
    return (
      <main className="h-full w-full flex flex-col gap-4">
        <TalkingMascot message="Loading your content request details..." />
        <div className="container mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-48 bg-gray-200 rounded"></div>
          </div>
        </div>
      </main>
    );
  }

  if (requestError || !request) {
    return (
      <main className="h-full w-full flex flex-col gap-4">
        <TalkingMascot message="Oops! We couldn't find that content request. Let's get you back on track!" />
        <div className="container mx-auto">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <h3 className="text-lg font-semibold mb-2">Request Not Found</h3>
              <p className="text-muted-foreground">
                The content request you're looking for doesn't exist or you don't have access to it.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="h-full w-full flex flex-col gap-4">
      <TalkingMascot message="Here are the details for your content request! Review the information, check similarities, and take action if needed." />
      <div className="container mx-auto space-y-6">
        {/* Action Buttons Bar */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
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
          <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <span className="font-semibold text-yellow-800">
              Request Similarity:
            </span>
            <span className="text-yellow-700">
              {similarity.message}
            </span>
            <span className="ml-auto text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
              {Math.round(similarity.similarity * 100)}%
            </span>
          </div>
        )}
        
        {/* Content Similarity (for generated content) */}
        {contentSimilarity && !isLoadingContentSimilarity && canExport && (
          <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg p-4">
            <span className="font-semibold text-orange-800">
              Content Similarity:
            </span>
            <span className="text-orange-700">
              {contentSimilarity.message}
            </span>
            <span className="ml-auto text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
              {Math.round(contentSimilarity.similarity * 100)}%
            </span>
          </div>
        )}
      </div>

      {/* Request Details */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Request Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{request.topic}</CardTitle>
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
                {isLoadingContent ? (
                  <div className="bg-gray-50 rounded-lg p-8 min-h-[300px] flex flex-col items-center justify-center">
                    <TalkingMascot message="Loading your generated content..." />
                    <div className="animate-pulse space-y-4 w-full mt-4">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    </div>
                  </div>
                ) : contentError ? (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 min-h-[300px] flex items-center justify-center">
                    <p className="text-red-600">Failed to load generated content. Please try again.</p>
                  </div>
                ) : content?.text ? (
                  <div className="bg-white rounded-lg border p-6 min-h-[300px]">
                    <div className="prose max-w-none">
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {content.text}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4 min-h-[300px] flex items-center justify-center">
                    <p className="text-muted-foreground">No content available yet.</p>
                  </div>
                )}
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
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </main>
  );
}
