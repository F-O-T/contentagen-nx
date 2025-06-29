import { ContentRequestCard } from "@/widgets/content-request-card/ui/content-request-card";
import { TalkingMascot } from "@/widgets/talking-mascot/ui/talking-mascot";
import { Card, CardContent, CardHeader } from "@packages/ui/components/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@packages/ui/components/tabs";
import { CreateNewContentRequestButton } from "@/pages/content-list/ui/create-new-content-request-button";

import { useContentRequests } from "../lib/use-content-requests";

type ContentRequestStatus = "pending" | "approved" | "rejected";

interface SimilarityData {
  similarity: number;
  category: "success" | "info" | "warning" | "error";
  message: string;
}

export function ContentRequestsPage() {
  const {
    requests: filteredRequests,
    isLoadingRequests,
    activeTab,
    setActiveTab,
    similarityQueries,
    handleViewDetails,
    handleRefresh,
    getTabCount,
  } = useContentRequests();

  return (
    <main className="h-full w-full flex flex-col gap-4">
      <TalkingMascot message="Here you can manage all your content requests. Track their status, review similarities, and take action on pending requests!" />
      
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <p className="text-muted-foreground">
                    {activeTab === "all"
                      ? "You haven't created any content requests yet."
                      : `No ${activeTab} requests found.`}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      
      <CreateNewContentRequestButton />
    </main>
  );
}
