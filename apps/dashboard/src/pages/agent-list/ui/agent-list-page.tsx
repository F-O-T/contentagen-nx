import { useSuspenseQuery } from "@tanstack/react-query";
import { TalkingMascot } from "@/widgets/talking-mascot/ui/talking-mascot";
import { AgentCard } from "./agent-card";
import { AgentListToolbar } from "./agent-list-toolbar";
import { AgentListProvider, useAgentList } from "../lib/agent-list-context";
import { useTRPC } from "@/integrations/clients";

function AgentListPageContent() {
   const trpc = useTRPC();
   const { page, limit } = useAgentList();
   const { data } = useSuspenseQuery(
      trpc.agent.list.queryOptions({ page, limit }),
   );

   return (
      <main className="h-full w-full flex flex-col gap-4 ">
         <TalkingMascot message="Here you can manage all your AI agents. Create, edit, or explore your team below!" />
         <AgentListToolbar />
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data?.items?.map((agent) => (
               <AgentCard key={agent.id} agent={agent} />
            ))}
         </div>
      </main>
   );
}

export function AgentListPage() {
   const trpc = useTRPC();
   const { data } = useSuspenseQuery(
      trpc.agent.list.queryOptions({ page: 1, limit: 8 }),
   );

   return (
      <AgentListProvider data={data}>
         <AgentListPageContent />
      </AgentListProvider>
   );
}
