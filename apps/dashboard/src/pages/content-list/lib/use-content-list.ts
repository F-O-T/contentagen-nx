import { createQueryKey } from "@packages/eden";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useParams, useRouteContext } from "@tanstack/react-router";

export function useContentList() {
  const { eden } = useRouteContext({
    from: "/_dashboard/content/$agentId",
  });
  const agentId = useParams({
    from: "/_dashboard/content/$agentId",
  }).agentId
  const { data, isLoading, error } = useSuspenseQuery({
    queryFn: eden.api.v1.content.request.list.get,
    queryKey: createQueryKey(
      agentId
        ? `eden.api.v1.content.request.agent.${agentId}.get`
        : "eden.api.v1.content.request.get",
    ),
    select: (data) => data.data,
  });

  return {
    requests: data?.requests || [],
    isLoading,
    error,
    agentId,
  };
}