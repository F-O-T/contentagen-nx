import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
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
import { useSubscription } from "@trpc/tanstack-react-query";
import { useMemo } from "react";
import { toast } from "sonner";

export function AgentDetailsContentRequestsCard() {
   const { agentId } = useParams({ from: "/_dashboard/agents/$agentId/" });
   const navigate = useNavigate();
   const trpc = useTRPC();

   const { data } = useSuspenseQuery(
      trpc.content.list.queryOptions({
         agentId,
         status: ["draft", "approved", "generating"],
      }),
   );
   const queryClient = useQueryClient();
   const hasGenerating = useMemo(
      () => data.some((item) => item.status === "generating"),
      [data],
   );

   useSubscription(
      trpc.content.onStatusChanged.subscriptionOptions(
         {},
         {
            onData(data) {
               toast.success(
                  `Content finished generation, status updated to ${data.status}`,
               );
               queryClient.invalidateQueries({
                  queryKey: trpc.content.list.queryKey({
                     agentId,
                     status: ["draft", "approved", "generating"],
                  }),
               });
            },
            enabled: hasGenerating,
         },
      ),
   );
   return (
      <Card className="h-full">
         <CardHeader>
            <CardTitle>Content</CardTitle>
            <CardDescription>Content linked to this agent</CardDescription>
         </CardHeader>
         <CardContent className="gap-4 grid grid-cols-1 md:grid-cols-3">
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
