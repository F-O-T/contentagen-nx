import { useQuery, useQueries } from "@tanstack/react-query";
import { useRouteContext, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

type ContentRequestStatus = "pending" | "approved" | "rejected";

interface SimilarityData {
  similarity: number;
  category: "success" | "info" | "warning" | "error";
  message: string;
}

export function useContentRequests() {
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

  return {
    requests: filteredRequests,
    isLoadingRequests,
    activeTab,
    setActiveTab,
    similarityQueries,
    handleViewDetails,
    handleRefresh,
    getTabCount,
  };
}