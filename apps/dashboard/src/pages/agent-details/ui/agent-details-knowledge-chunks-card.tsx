import { useSuspenseQuery } from "@tanstack/react-query";
import {
   Card,
   CardHeader,
   CardTitle,
   CardContent,
   CardDescription,
} from "@packages/ui/components/card";
import { useParams } from "@tanstack/react-router";
import { useTRPC } from "@/integrations/clients";

export function AgentDetailsKnowledgeChunksCard() {
   const { agentId } = useParams({ from: "/_dashboard/agents/$agentId/" });
   const trpc = useTRPC();

   const { data, isLoading, error } = useSuspenseQuery(
      trpc.agentKnowledge.listByAgentId.queryOptions({ agentId }),
   );
   console.log("Knowledge Chunks Data:", data);
   return (
      <Card className="h-full">
         <CardHeader>
            <CardTitle>Knowledge Chunks</CardTitle>
            <CardDescription>
               All knowledge chunks for this agent
            </CardDescription>
         </CardHeader>
         <CardContent></CardContent>
      </Card>
   );
}
