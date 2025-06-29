import { Button } from "@packages/ui/components/button";
import {
   Card,
   CardContent,
   CardFooter,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { createQueryKey } from "@packages/eden";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";

export type ContentRequest = {
   id: string;
   title: string;
   context: string;
   status: "pending" | "approved" | "completed";
   createdAt: string;
   updatedAt: string;
   agentId: string | null;
   userId: string;
   isCompleted: boolean;
   generatedContentId: string | null;
};

export function ContentRequestCard({ request }: { request: ContentRequest }) {
   const queryClient = useQueryClient();
   const { eden } = useRouteContext({
      from: "/_dashboard/agents/$agentId/content/request",
   });
   const { mutate, isPending } = useMutation({
      mutationFn: eden.api.v1.content.request.approve({ id: request.id }).post,
      onSuccess: () => {
         queryClient.invalidateQueries({
            queryKey: createQueryKey("eden.api.v1.content.request.get"),
         });
         queryClient.invalidateQueries({
            queryKey: createQueryKey(
               `eden.api.v1.content.request.agent.${request.agentId}.get`,
            ),
         });
      },
   });

   return (
      <Card>
         <CardHeader>
            <CardTitle>{request.title}</CardTitle>
         </CardHeader>
         <CardContent>
            <p>{request.context}</p>
         </CardContent>
         <CardFooter className="flex justify-between">
            <span className="text-sm text-gray-500">
               {new Date(request.createdAt).toLocaleDateString()}
            </span>
            {request.status === "pending" && (
               <Button onClick={() => mutate()} disabled={isPending}>
                  Approve
               </Button>
            )}
         </CardFooter>
      </Card>
   );
}
