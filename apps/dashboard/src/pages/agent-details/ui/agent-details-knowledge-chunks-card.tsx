import { useSuspenseQuery } from "@tanstack/react-query";
import { ScrollArea } from "@packages/ui/components/scroll-area";
import {
   Card,
   CardHeader,
   CardTitle,
   CardContent,
   CardFooter,
   CardDescription,
   CardAction,
} from "@packages/ui/components/card";
import { Button } from "@packages/ui/components/button";
import {
   Credenza,
   CredenzaTrigger,
   CredenzaContent,
   CredenzaHeader,
   CredenzaTitle,
   CredenzaDescription,
   CredenzaBody,
   CredenzaFooter,
   CredenzaClose,
} from "@packages/ui/components/credenza";
import { useParams } from "@tanstack/react-router";
import { useTRPC } from "@/integrations/clients";
import { Markdown } from "@packages/ui/components/markdown";

export function AgentDetailsKnowledgeChunksCard() {
   const { agentId } = useParams({ from: "/_dashboard/agents/$agentId/" });
   const trpc = useTRPC();

   const { data, isLoading, error } = useSuspenseQuery(
      trpc.agentKnowledge.listByAgentId.queryOptions({ agentId }),
   );

   return (
      <Card className="h-full">
         <CardHeader>
            <CardTitle>Knowledge Chunks</CardTitle>
            <CardDescription>
               All knowledge chunks for this agent
            </CardDescription>
         </CardHeader>
         <CardContent>
            {isLoading ? (
               <div className="py-8 text-center text-muted-foreground">
                  Loading knowledge chunks...
               </div>
            ) : error ? (
               <div className="py-8 text-center text-destructive">
                  Error loading knowledge chunks.
               </div>
            ) : !data?.metadatas?.length ? (
               <div className="py-8 text-center text-muted-foreground">
                  No knowledge chunks found for this agent.
               </div>
            ) : (
               <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {data.metadatas.map((meta, idx) => {
                     return (
                        <Card className="relative transition hover:shadow-lg">
                           <CardHeader>
                              <div className="flex items-center gap-2 mb-2">
                                 <span className="inline-block px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-700">
                                    {meta.sourceType}
                                 </span>
                                 <span className="inline-block px-2 py-1 text-xs font-semibold rounded bg-purple-100 text-purple-700">
                                    Agent: {meta.agentId?.slice(0, 8) ?? "-"}...
                                 </span>
                              </div>
                              <CardTitle className="truncate text-base">
                                 {meta.summary?.length > 60
                                    ? meta.summary.slice(0, 60) + "..."
                                    : meta.summary}
                              </CardTitle>
                              <CardDescription className="truncate">
                                 {data.documents?.[idx] &&
                                    (data.documents[idx].length > 60
                                       ? data.documents[idx].slice(0, 60) +
                                         "..."
                                       : data.documents[idx])}
                              </CardDescription>
                              <CardAction>
                                 <Credenza>
                                    <CredenzaTrigger asChild>
                                       <Button variant="outline" size="sm">
                                          View Details
                                       </Button>
                                    </CredenzaTrigger>
                                    <CredenzaContent>
                                       <CredenzaHeader>
                                          <CredenzaTitle>
                                             Knowledge Chunk Details
                                          </CredenzaTitle>
                                          <CredenzaDescription>
                                             The details for this knowledge
                                             chunk
                                          </CredenzaDescription>
                                       </CredenzaHeader>
                                       <CredenzaBody>
                                          <ScrollArea className="max-h-[30vh] h-auto">
                                             {data.documents?.[idx] && (
                                                <Markdown
                                                   content={data.documents[idx]}
                                                />
                                             )}
                                          </ScrollArea>
                                       </CredenzaBody>
                                    </CredenzaContent>
                                 </Credenza>
                              </CardAction>
                           </CardHeader>
                           <CardContent>
                              <span className="text-xs text-gray-400">
                                 Knowledge Chunk
                              </span>
                           </CardContent>
                        </Card>
                     );
                  })}
               </div>
            )}
         </CardContent>
      </Card>
   );
}
