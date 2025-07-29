import { useSuspenseQuery } from "@tanstack/react-query";
import {
   Card,
   CardHeader,
   CardTitle,
   CardContent,
   CardFooter,
   CardDescription,
} from "@packages/ui/components/card";
import { Button } from "@packages/ui/components/button";
import { useParams } from "@tanstack/react-router";
import { useState } from "react";
import { useTRPC } from "@/integrations/clients";

export function AgentDetailsKnowledgeChunksCard() {
   const { agentId } = useParams({ from: "/_dashboard/agents/$agentId/" });
   const trpc = useTRPC();
   const [viewedChunk, setViewedChunk] = useState<string | null>(null);

   const { data, isLoading, error } = useSuspenseQuery(
      trpc.agentKnowledge.listByAgentId.queryOptions({ agentId }),
   );

   return (
      <Card>
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
