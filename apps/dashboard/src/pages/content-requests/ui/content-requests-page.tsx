import { useQuery, useQueries } from "@tanstack/react-query";
import { useRouteContext, useNavigate } from "@tanstack/react-router";
import { ContentRequestCard } from "@/widgets/content-request-card/ui/content-request-card";
import { Button } from "@packages/ui/components/button";
import { Card, CardContent, CardHeader } from "@packages/ui/components/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@packages/ui/components/tabs";
import { PlusCircle, RefreshCw } from "lucide-react";
import { useState } from "react";
import { Link } from "@tanstack/react-router";

type ContentRequestStatus = "pending" | "approved" | "rejected";

interface SimilarityData {
  similarity: number;
  category: "success" | "info" | "warning" | "error";
  message: string;
}

export function ContentRequestsPage() {
  const { eden } = useRouteContext({ from: "/_dashboard/content/" });
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ContentRequestStatus | "all">("all");

  // Fetch content requests
  const {
    data: requestsData,
    isLoading: isLoadingRequests,
    refetch: refetchRequests,
  } = useQuery({
    queryKey: ["content-requests", activeTab],
    queryFn: () =>
      eden.api.v1.content.request.list.get({
        query: {
          status: activeTab === "all" ? undefined : activeTab,
          limit: 50,
        },
      }),
  });

  const requests = requestsData?.data?.requests || [];

  // Fetch similarity data for each request using useQueries
  const similarityQueries = useQueries({
    queries: requests.map((request) => ({
      queryKey: ["content-request-similarity", request.id],
      queryFn: () =>
        eden.api.v1.content.request.similarities({ id: request.id }).get(),
      enabled: !!request.id,
    })),
  });

  const handleViewDetails = (requestId: string) => {
    // Navigate to details page using React Router
    navigate({ to: '/content/requests/$requestId', params: { requestId } });
  };

  const handleRefresh = () => {
    refetchRequests();
    similarityQueries.forEach((query) => query.refetch());
  };

  const filteredRequests = requests.filter((request) => {
    if (activeTab === "all") return true;
    return request.status === activeTab;
  });

  const getTabCount = (status: ContentRequestStatus | "all") => {
    if (status === "all") return requests.length;
    return requests.filter((req) => req.status === status).length;
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Content Requests</h1>
          <p className="text-muted-foreground mt-1">
            Manage and track your content generation requests
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Link to="/agents" className="inline-flex">
            <Button size="sm">
              <PlusCircle className="h-4 w-4 mr-2" />
              New Request
            </Button>
          </Link>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ContentRequestStatus | "all")}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all" className="flex items-center gap-2">
            All <span className="text-xs">({getTabCount("all")})</span>
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            Pending <span className="text-xs">({getTabCount("pending")})</span>
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex items-center gap-2">
            Approved <span className="text-xs">({getTabCount("approved")})</span>
          </TabsTrigger>
          <TabsTrigger value="rejected" className="flex items-center gap-2">
            Rejected <span className="text-xs">({getTabCount("rejected")})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {isLoadingRequests ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                      <div className="h-12 bg-gray-200 rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredRequests.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">No requests found</h3>
                  <p className="text-muted-foreground mb-4">
                    {activeTab === "all"
                      ? "You haven't created any content requests yet."
                      : `No ${activeTab} requests found.`}
                  </p>
                  <Link to="/agents">
                    <Button>
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Create Your First Request
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredRequests.map((request, index) => {
                const similarityQuery = similarityQueries[index];
                const similarityData = similarityQuery?.data?.data as SimilarityData | undefined;
                
                return (
                  <ContentRequestCard
                    key={request.id}
                    request={{
                      ...request,
                      isCompleted: request.isCompleted ?? false,
                      createdAt: typeof request.createdAt === 'string' 
                        ? request.createdAt 
                        : request.createdAt?.toISOString() ?? new Date().toISOString(),
                      updatedAt: typeof request.updatedAt === 'string' 
                        ? request.updatedAt 
                        : request.updatedAt?.toISOString() ?? new Date().toISOString(),
                      generatedContentId: request.generatedContentId ?? undefined,
                    }}
                    similarity={similarityData}
                    onViewDetails={handleViewDetails}
                    isLoading={similarityQuery?.isLoading}
                  />
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
