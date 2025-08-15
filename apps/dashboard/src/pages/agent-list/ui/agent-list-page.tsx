import { useSuspenseQuery } from "@tanstack/react-query";
import { TalkingMascot } from "@/widgets/talking-mascot/ui/talking-mascot";
import { AgentCard } from "./agent-card";
import { CreateNewAgentButton } from "./create-new-agent-button";
import { useTRPC } from "@/integrations/clients";

export function AgentListPage() {
   const trpc = useTRPC();
   const { data } = useSuspenseQuery(trpc.agent.list.queryOptions());

   return (
      <main className="h-full w-full flex flex-col gap-4 ">
         <TalkingMascot message="Here you can manage all your AI agents. Create, edit, or explore your team below!" />
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data?.map((agent) => (
               <AgentCard key={agent.id} agent={agent} />
            ))}
            <CreateNewAgentButton />
         </div>
      </main>
   );
}
