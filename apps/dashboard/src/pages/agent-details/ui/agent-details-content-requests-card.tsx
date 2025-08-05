import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { ContentRequestCard } from "@/widgets/content-card/ui/content-card";

import {
   Card,
   CardHeader,
   CardTitle,
   CardContent,
   CardFooter,
   CardDescription,
} from "@packages/ui/components/card";
import { Button } from "@packages/ui/components/button";
import { useParams, useNavigate } from "@tanstack/react-router";
import { useTRPC } from "@/integrations/clients";

export function AgentDetailsContentRequestsCard() {
   const { agentId } = useParams({ from: "/_dashboard/agents/$agentId/" });
   const navigate = useNavigate();
   const trpc = useTRPC();

   const { data } = useSuspenseQuery(
      trpc.content.list.queryOptions({ agentId }),
   );

   return (
      <Card className="h-full">
         <CardHeader>
            <CardTitle>Content</CardTitle>
            <CardDescription>Content linked to this agent</CardDescription>
         </CardHeader>
         <CardContent>
            {data.map((req) => (
               <ContentRequestCard key={req.id} request={req} />
            ))}
         </CardContent>
         <CardFooter className="flex justify-end">
            <Button
               variant="outline"
               size="sm"
               onClick={() =>
                  navigate({
                     to: "/agents/$agentId/content/request",
                     params: { agentId },
                  })
               }
            >
               + New Content Request
            </Button>
         </CardFooter>
      </Card>
   );
}
