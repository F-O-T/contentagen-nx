import { useSuspenseQuery } from "@tanstack/react-query";
import { TalkingMascot } from "@/widgets/talking-mascot/ui/talking-mascot";
import { AgentCard } from "./agent-card";
import { CreateNewAgentButton } from "./create-new-agent-button";
import { useTrpc } from "@/integrations/trpc";
export function AgentListPage() {
   const trpc = useTrpc();
   const { data } = useSuspenseQuery(trpc.agent.listByUser.queryOptions());

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
