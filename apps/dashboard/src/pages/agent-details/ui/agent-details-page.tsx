import { TalkingMascot } from "@/widgets/talking-mascot/ui/talking-mascot";
import { translate } from "@packages/localization";
import { AgentPersonaCard } from "./agent-details-persona-card";
import { AgentStatsCard } from "./agent-stats-card";
import { AgentInstructionsContainer } from "../features/agent-instructions-container";
import { Suspense, useState } from "react";
import { useTRPC } from "@/integrations/clients";
import { useSuspenseQuery } from "@tanstack/react-query";
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

   return (
      <Suspense>
         <main className="flex flex-col gap-4">
            <TalkingMascot
               message={translate("pages.agent-details.mascot-message")}
            />
            <div className="grid md:grid-cols-3 grid-cols-1  gap-4 h-full">
               <div className="col-span-1  md:col-span-2 flex flex-col   gap-4">
                  <AgentStatsCard />
                  <AgentInstructionsContainer
                     agent={agent}
                     isEditing={isEditingInstructions}
                     setIsEditing={setIsEditingInstructions}
                  />
               </div>
               <div className="col-span-1 gap-4 flex flex-col">
                  <AgentDetailsQuickActions
                     agent={agent}
                     onEditInstructions={() => setIsEditingInstructions(true)}
                  />
                  <AgentPersonaCard agent={agent} />
                  <AgentNavigationButtons agentId={agentId} />
               </div>
            </div>
         </main>
      </Suspense>
   );
}
