import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
   Card,
   CardHeader,
   CardTitle,
   CardContent,
   CardFooter,
   CardDescription,
} from "@packages/ui/components/card";
import { Button } from "@packages/ui/components/button";
import { toast } from "sonner";
import { useParams } from "@tanstack/react-router";
import { useState } from "react";
import { useTRPC } from "@/integrations/clients";

export function AgentDetailsKnowledgeChunksCard() {
   const { agentId } = useParams({ from: "/_dashboard/agents/$agentId/" });
   const queryClient = useQueryClient();
   const trpc = useTRPC();
   const [viewedChunk, setViewedChunk] = useState<string | null>(null);

   // Note: This might need to be adjusted based on actual TRPC endpoint structure
   // For now, using a placeholder as there might not be a direct chunks endpoint
   const { data, isLoading, error } = useQuery({
      queryKey: ["agent", agentId, "chunks"],
      queryFn: async () => {
         // TODO: Replace with actual TRPC endpoint when available
         // This is a placeholder - you may need to implement the chunks endpoint
         return [];
      },
   });

   const deleteChunkMutation = useMutation(
      trpc.agentKnowledge.deleteById.mutationOptions({
         onSuccess: () => {
            toast.success("Chunk deleted successfully");
            queryClient.invalidateQueries({
               queryKey: ["agent", agentId, "chunks"],
            });
         },
         onError: () => {
            toast.error("Failed to delete chunk");
         },
      })
   );

   return (
      <Card>
         <CardHeader>
            <CardTitle>Knowledge Chunks</CardTitle>
            <CardDescription>
               All knowledge chunks for this agent
            </CardDescription>
         </CardHeader>
         <CardContent>
            {isLoading ? (
               <div>Loading...</div>
            ) : error ? (
               <div className="text-red-500">Failed to load chunks</div>
            ) : !data || data.length === 0 ? (
               <div>No knowledge chunks found.</div>
            ) : (
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {data.map((chunk: { id: string; content?: string }) => (
                     <Card key={chunk.id} className="border shadow-sm">
                        <CardHeader>
                           <CardTitle className="line-clamp-1 text-base">
                              {chunk.id}
                           </CardTitle>
                        </CardHeader>
                        <CardContent>
                           {viewedChunk === chunk.id && (
                              <pre className="bg-muted p-2 rounded text-xs overflow-x-auto whitespace-pre-wrap max-h-48">
                                 {chunk.content ||
                                    JSON.stringify(chunk, null, 2)}
                              </pre>
                           )}
                        </CardContent>
                        <CardFooter className="flex gap-2">
                           <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                 setViewedChunk(
                                    viewedChunk === chunk.id ? null : chunk.id,
                                 )
                              }
                           >
                              {viewedChunk === chunk.id ? "Hide" : "View"}
                           </Button>
                           <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                 if (
                                    confirm(
                                       "Are you sure you want to delete this chunk?",
                                    )
                                 ) {
                                    deleteChunkMutation.mutate({ id: chunk.id });
                                 }
                              }}
                           >
                              Delete
                           </Button>
                        </CardFooter>
                     </Card>
                  ))}
               </div>
            )}
         </CardContent>
         <CardFooter></CardFooter>
      </Card>
   );
}
