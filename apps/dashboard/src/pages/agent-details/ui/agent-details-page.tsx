import { TalkingMascot } from "@/widgets/talking-mascot/ui/talking-mascot";
import { AgentPersonaCard } from "./agent-details-persona-card";
import { AgentStatsCard } from "./agent-stats-card";
import { Suspense, useMemo } from "react";
import { useSubscription } from "@trpc/tanstack-react-query";
import { toast } from "sonner";
import { useTRPC } from "@/integrations/clients";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { AgentDetailsQuickActions } from "./agent-details-quick-actions";
import { AgentDetailsKnowledgeBaseCard } from "./agent-details-knowledge-base-card";
import { AgentNavigationButtons } from "./agent-navigation-buttons";

export function AgentDetailsPage() {
   const trpc = useTRPC();
   const { agentId } = useParams({ from: "/_dashboard/agents/$agentId/" });

   const { data: agent } = useSuspenseQuery(
      trpc.agent.get.queryOptions({ id: agentId }),
   );

   const queryClient = useQueryClient();
   const isRunning = useMemo(
      () =>
         agent &&
         ["pending", "analyzing", "chunking"].includes(
            agent.brandKnowledgeStatus,
         ),
      [agent],
   );

   useSubscription(
      trpc.agent.onBrandKnowledgeStatusChanged.subscriptionOptions(
         { agentId },
         {
            async onData(data) {
               await queryClient.invalidateQueries({
                  queryKey: trpc.agent.get.queryKey({ id: agentId }),
               });

               if (data.status === "failed") {
                  toast.error(data.message || "Brand knowledge job failed");
                  return;
               }
               if (data.status === "completed") {
                  toast.success(
                     data.message || "Brand knowledge job completed",
                  );

                  return;
               }

               toast.info(data.message || `Status: ${data.status}`);
            },
            enabled: isRunning,
         },
      ),
   );

   return (
      <Suspense>
         <main className="flex flex-col gap-4">
            <TalkingMascot message="Manage your agent's configuration and knowledge base." />
            <div className="grid md:grid-cols-3 grid-cols-1  gap-4">
               <div className="col-span-1  md:col-span-2 flex flex-col  gap-4">
                  <AgentStatsCard />
                  <AgentPersonaCard agent={agent} />
               </div>
               <div className="col-span-1 gap-4 flex flex-col">
                  <AgentDetailsQuickActions agent={agent} />
                  <AgentDetailsKnowledgeBaseCard agent={agent} />
               </div>
               <div className="md:col-span-3">
                  <AgentNavigationButtons agentId={agentId} />
               </div>
            </div>
         </main>
      </Suspense>
   );
}
