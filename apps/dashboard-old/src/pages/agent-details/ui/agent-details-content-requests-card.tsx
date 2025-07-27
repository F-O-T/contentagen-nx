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
import { InfoItem } from "@packages/ui/components/info-item";
import { Activity } from "lucide-react";

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
               <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {data.map(
                     (req: {
                        id: string;
                        topic: string;
                        briefDescription: string;

                        createdAt: Date;
                        updatedAt: Date;
                        agentId: string;
                        generatedContentId: string | null;
                        isCompleted: boolean | null;
                     }) => (
                        <Card key={req.id} className="border shadow-sm">
                           <CardHeader>
                              <CardTitle className="line-clamp-1 text-base">
                                 {req.topic}
                              </CardTitle>
                              <CardDescription className="line-clamp-1 text-xs">
                                 {req.briefDescription}
                              </CardDescription>
                           </CardHeader>
                           <CardContent>
                              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                                 <span>
                                    Created:{" "}
                                    {new Date(
                                       req.createdAt,
                                    ).toLocaleDateString()}
                                 </span>
                              </div>
                              <InfoItem
                                 icon={<Activity className="h-4 w-4" />}
                                 label="Status"
                                 value={
                                    req.isCompleted === true
                                       ? "Completed"
                                       : "Generating"
                                 }
                              />
                           </CardContent>
                           <CardFooter>
                              <Button
                                 className="w-full"
                                 variant="outline"
                                 size="sm"
                                 onClick={() =>
                                    navigate({
                                       to: "/content/requests/$requestId",
                                       params: { requestId: req.id },
                                    })
                                 }
                              >
                                 Manage your content
                              </Button>
                           </CardFooter>
                        </Card>
                     ),
                  )}
               </div>
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
