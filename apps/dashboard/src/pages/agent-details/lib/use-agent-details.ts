import { createQueryKey } from "@packages/eden";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useParams, useRouteContext } from "@tanstack/react-router";

export default function useAgentDetails() {
   // Get agentId from URL params
   const { agentId } = useParams({ from: "/_dashboard/agents/$agentId/" });
   const { eden } = useRouteContext({ from: "/_dashboard/agents/$agentId/" });

   // Fetch agent data
   const { data: agentData, isLoading } = useSuspenseQuery({
      queryKey: createQueryKey("eden.api.v1.agents({ id: agentId }).get"),
      queryFn: async () => await eden.api.v1.agents({ id: agentId }).get(),
      select: (data) => data.data,
   });

   return {
      agent: agentData?.agent,
      isLoading,
      uploadedFiles: agentData?.agent?.uploadedFiles || [],
   };
}
