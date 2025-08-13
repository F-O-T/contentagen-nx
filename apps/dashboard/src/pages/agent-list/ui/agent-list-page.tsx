import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { TalkingMascot } from "@/widgets/talking-mascot/ui/talking-mascot";
import { AgentCard } from "./agent-card";
import { CreateNewAgentButton } from "./create-new-agent-button";
import { betterAuthClient, useTRPC } from "@/integrations/clients";

export function AgentListPage() {
   const trpc = useTRPC();
   // Get organizationId from search params (TanStack Router v1)
   const { data: org } = useSuspenseQuery({
      queryKey: ["activeOrganization"],
      queryFn: async () => {
         const orgs = await betterAuthClient.organization.list();
         if (!orgs.data) {
            throw new Error("Failed to fetch organizations");
         }
         if (!orgs?.data[0]?.id) {
            throw new Error("No organizations found");
         }
         await betterAuthClient.organization.setActive({
            organizationId: orgs?.data[0]?.id,
         });
         const { data, error } =
            await betterAuthClient.organization.getFullOrganization();
         if (error) throw new Error("Failed to load organization");
         return data;
      },
   });
   //TODO: mover o setOrganization para o databaseHooks com o betterAuth
   const { data } = useQuery(
      trpc.agent.list.queryOptions(
         { organizationId: org?.id },
         { enabled: !!org?.id },
      ),
   );

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
