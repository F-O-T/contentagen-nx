import { TalkingMascot } from "@/widgets/talking-mascot/ui/talking-mascot";
import { translate } from "@packages/localization";
import { AgentPersonaCard } from "./agent-details-persona-card";
import { AgentStatsCard } from "./agent-stats-card";
import { AgentInstructionsContainer } from "../features/agent-instructions-container";
import { Suspense, useMemo, useState } from "react";
import { useSubscription } from "@trpc/tanstack-react-query";
import { toast } from "sonner";
import { useTRPC } from "@/integrations/clients";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { AgentDetailsQuickActions } from "./agent-details-quick-actions";
import { AgentNavigationButtons } from "./agent-navigation-buttons";

export function AgentDetailsPage() {
   const trpc = useTRPC();
   const { agentId } = useParams({ from: "/_dashboard/agents/$agentId/" });
   const [isEditingInstructions, setIsEditingInstructions] = useState(false);

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
                  toast.error(
                     data.message ||
                        translate(
                           "pages.agent-details.toasts.knowledge-failed",
                        ),
                  );
                  return;
               }
               if (data.status === "completed") {
                  toast.success(
                     data.message ||
                        translate(
                           "pages.agent-details.toasts.knowledge-completed",
                        ),
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
            <TalkingMascot
               message={translate("pages.agent-details.mascot-message")}
            />
            <div className="grid md:grid-cols-3 grid-cols-1  gap-4 h-full">
               <div className="col-span-1  md:col-span-2 flex flex-col   gap-4">
                  <AgentStatsCard />
               </div>
               <div className="col-span-1 gap-4 flex flex-col">
                  <AgentDetailsQuickActions 
                     agent={agent} 
                     onEditInstructions={() => setIsEditingInstructions(true)}
                  />
                  <AgentPersonaCard agent={agent} />
               </div>

               <div className="col-span-1 gap-4 flex flex-col md:col-span-3">
                  <AgentInstructionsContainer 
                     agent={agent} 
                     isEditing={isEditingInstructions}
                     setIsEditing={setIsEditingInstructions}
                  />
               </div>

               <div className="md:col-span-3">
                  <AgentNavigationButtons agentId={agentId} />
               </div>
            </div>
         </main>
      </Suspense>
   );
}
