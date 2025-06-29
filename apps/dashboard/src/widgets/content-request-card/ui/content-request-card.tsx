import { Card, CardContent, CardHeader, CardTitle } from "@packages/ui/components/card";
import { Badge } from "@packages/ui/components/badge";
import { SimilarityBanner } from "@packages/ui/components/similarity-banner";
import { FileText, Clock, User } from "lucide-react";
import { useMemo } from "react";
import { formatValueToTitleCase } from "@packages/ui/lib/utils";

export interface ContentRequestCardProps {
  request: {
    id: string;
    topic: string;
    briefDescription: string;
    targetLength: string;
    status: "pending" | "approved" | "rejected";
    isCompleted: boolean;
    createdAt: string;
    updatedAt: string;
    agentId: string;
    generatedContentId?: string;
  };
  similarity?: {
    similarity: number;
    category: "success" | "info" | "warning" | "error";
    message: string;
  };
  onViewDetails?: (requestId: string) => void;
  isLoading?: boolean;
}

const statusConfig = {
  pending: { color: "bg-yellow-100 text-yellow-800", label: "Pending" },
  approved: { color: "bg-green-100 text-green-800", label: "Approved" },
  rejected: { color: "bg-red-100 text-red-800", label: "Rejected" },
} as const;

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMilliseconds = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMilliseconds / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 1) return "just now";
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInDays < 7) return `${diffInDays}d ago`;
  
  return date.toLocaleDateString();
}

export function ContentRequestCard({
  request,
  similarity,
  onViewDetails,
  isLoading = false,
}: ContentRequestCardProps) {
  const statusBadge = statusConfig[request.status];
  
  const timeAgo = useMemo(() => {
    return formatTimeAgo(request.createdAt);
  }, [request.createdAt]);

  const hasExportOptions = request.status === "approved" && request.isCompleted;

  return (
    <Card 
      className="w-full cursor-pointer hover:shadow-lg transition-shadow duration-200"
      onClick={() => onViewDetails?.(request.id)}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-lg font-semibold line-clamp-2">
              {request.topic}
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{timeAgo}</span>
            </div>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <Badge className={statusBadge.color}>
              {statusBadge.label}
            </Badge>
            {request.isCompleted && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                Completed
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground line-clamp-3">
            {request.briefDescription}
          </p>
          
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              <span>{formatValueToTitleCase(request.targetLength)} length</span>
            </div>
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span>Agent: {request.agentId.slice(0, 8)}...</span>
            </div>
          </div>
        </div>

        {/* Similarity Banner */}
        {similarity && !isLoading && (
          <SimilarityBanner
            similarity={similarity.similarity}
            category={similarity.category}
            message={similarity.message}
            className="my-3"
          />
        )}

        {isLoading && (
          <div className="animate-pulse">
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {hasExportOptions && (
            <div className="flex-1 text-center text-sm text-muted-foreground">
              Click to view details & export options
            </div>
          )}
          {!hasExportOptions && request.status === "approved" && (
            <div className="flex-1 text-center text-sm text-muted-foreground">
              Content in progress... Click to view details
            </div>
          )}
          {request.status === "pending" && (
            <div className="flex-1 text-center text-sm text-yellow-600 font-medium">
              ⏳ Pending Approval • Click to approve or reject
            </div>
          )}
          {request.status === "rejected" && (
            <div className="flex-1 text-center text-sm text-muted-foreground">
              Request rejected... Click to view details
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
