import { useQuery } from "@tanstack/react-query";
import {
   Card,
   CardHeader,
   CardTitle,
   CardContent,
   CardFooter,
   CardDescription,
} from "@packages/ui/components/card";
import { Button } from "@packages/ui/components/button";
import {
   useParams,
   useRouteContext,
   useNavigate,
} from "@tanstack/react-router";

export function AgentDetailsContentRequestsCard() {
   const { agentId } = useParams({ from: "/_dashboard/agents/$agentId/" });
   const { eden } = useRouteContext({ from: "/_dashboard/agents/$agentId/" });
   const navigate = useNavigate();

   const { data, isLoading, error } = useQuery({
      queryKey: ["agent", agentId, "content-requests"],
      queryFn: async () => {
         const res = await eden.api.v1
            .agents({ id: agentId })
            ["content-requests"].get();
         if (res.error)
            throw new Error(
               res.error.value?.message || "Failed to fetch content requests",
            );
         return res.data.requests;
      },
   });

   return (
      <Card>
         <CardHeader>
            <CardTitle>Content Requests</CardTitle>
            <CardDescription>
               Requests for new content linked to this agent
            </CardDescription>
         </CardHeader>
         <CardContent>
            {isLoading ? (
               <div>Loading...</div>
            ) : error ? (
               <div className="text-red-500">
                  Failed to load content requests
               </div>
            ) : !data || data.length === 0 ? (
               <div>No content requests found.</div>
            ) : (
               <ul className="space-y-2">
                  {data.map(
                     (req: {
                        id: string;
                        topic: string;
                        briefDescription: string;
                        targetLength: number | null;
                        createdAt: Date;
                     }) => (
                        <li
                           key={req.id}
                           className="border rounded p-2 flex flex-col gap-1"
                        >
                           <div className="flex justify-between items-center">
                              <span className="font-mono text-xs truncate max-w-xs">
                                 {req.topic}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                 {new Date(req.createdAt).toLocaleDateString()}
                              </span>
                           </div>
                           <div className="text-xs text-muted-foreground">
                              {req.briefDescription}
                           </div>
                           <div className="text-xs">
                              Target Length: {req.targetLength ?? "-"}
                           </div>
                        </li>
                     ),
                  )}
               </ul>
            )}
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
