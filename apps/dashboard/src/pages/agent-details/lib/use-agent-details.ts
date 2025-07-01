import { useSuspenseQuery } from "@tanstack/react-query";
import { useParams, useRouteContext } from "@tanstack/react-router";


export default function useAgentDetails() {
   // Get agentId from URL params
   const { agentId } = useParams({ from: "/_dashboard/agents/$agentId/" });
   const { eden } = useRouteContext({ from: "/_dashboard/agents/$agentId/" });

   // Fetch agent data
   const { data: agentData, isLoading } = useSuspenseQuery({
      queryKey: ["agent", agentId],
      queryFn: async () => {
         const response = await eden.api.v1.agents({ id: agentId }).get();
         return response.data;
      },
   });

   const agent = agentData?.agent;
   const uploadedFiles = agent?.uploadedFiles || []

   return {
      agent,
      isLoading,
      uploadedFiles,
   };
}

