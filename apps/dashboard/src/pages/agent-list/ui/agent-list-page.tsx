import { createQueryKey } from "@packages/eden";

import { useSuspenseQuery } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import { TalkingMascot } from "@/widgets/talking-mascot/ui/talking-mascot";
import { AgentCard } from "./agent-card";
import { CreateNewAgentButton } from "./create-new-agent-button";
export function AgentListPage() {
   const { eden } = useRouteContext({ from: "/_dashboard/agents/" });
   const { data } = useSuspenseQuery({
      queryFn: async () => await eden.api.v1.agents.get(),
      queryKey: createQueryKey("eden.api.v1.agents.get"),
      select: (data) => data.data,
   });

   return (
      <main className="h-full w-full flex flex-col gap-4 ">
         <TalkingMascot message="Here you can manage all your AI agents. Create, edit, or explore your team below!" />
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data?.agents.map((agent) => (
               <AgentCard key={agent.id} agent={agent} />
            ))}
         </div>
         <CreateNewAgentButton />
      </main>
   );
}
