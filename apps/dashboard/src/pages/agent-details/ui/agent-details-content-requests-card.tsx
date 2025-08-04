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
import { useParams, useNavigate } from "@tanstack/react-router";
import { InfoItem } from "@packages/ui/components/info-item";
import { Activity } from "lucide-react";
import { useTRPC } from "@/integrations/clients";

export function AgentDetailsContentRequestsCard() {
   const { agentId } = useParams({ from: "/_dashboard/agents/$agentId/" });
   const navigate = useNavigate();
   const trpc = useTRPC();

   const { data, isLoading, error } = useQuery(
      trpc.content.list.queryOptions({ agentId }),
   );

   return (
      <Card className="h-full">
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
                  {data.map((req) => (
                     <Card key={req.id} className="border shadow-sm">
                        <CardHeader>
                           <CardTitle className="line-clamp-1 text-base">
                              {/* Topic removed, only description shown */}
                           </CardTitle>
                        </CardHeader>
                        <CardContent>
                           <InfoItem
                              icon={<Activity className="h-4 w-4" />}
                              label="Status"
                              value={
                                 req.status === true
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
                  ))}
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
