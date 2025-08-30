import {
   Credenza,
   CredenzaContent,
   CredenzaHeader,
   CredenzaTitle,
   CredenzaBody,
   CredenzaDescription,
} from "@packages/ui/components/credenza";
import { Button } from "@packages/ui/components/button";
import { Skeleton } from "@packages/ui/components/skeleton";
import { Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/integrations/clients";
import { AgentWriterCard } from "@/widgets/agent-display-card/ui/agent-writter-card";
import { useMemo } from "react";

export function CreateContentCredenza({
   open,
   onOpenChange,
}: {
   open: boolean;
   onOpenChange: (open: boolean) => void;
}) {
   const trpc = useTRPC();
   const { data, isLoading } = useSuspenseQuery(trpc.agent.list.queryOptions());
   const userHasAgents = useMemo(() => !!(data && data.length > 0), [data]);

   return (
      <Credenza open={open} onOpenChange={onOpenChange}>
         <CredenzaContent>
            <CredenzaHeader>
               <CredenzaTitle>Select Agent</CredenzaTitle>
               <CredenzaDescription>
                  Choose an agent to create content with. If you don't have any
                  agents, you can create one.
               </CredenzaDescription>
            </CredenzaHeader>
            <CredenzaBody className="grid grid-cols-1 gap-2">
               {isLoading && <Skeleton className="w-full h-16 mb-2" />}
               {!isLoading && !userHasAgents && (
                  <Link
                     to="/agents/manual"
                     className="w-full flex justify-center"
                  >
                     <Button variant="default" className="w-full">
                        No agents found. Create one
                     </Button>
                  </Link>
               )}
               {!isLoading &&
                  userHasAgents &&
                  data.map((agent) => (
                     <Link
                        key={agent.id}
                        to={"/agents/$agentId/content/request"}
                        params={{ agentId: agent.id }}
                     >
                        <AgentWriterCard
                           name={agent.personaConfig.metadata.name}
                           description={
                              agent.personaConfig.metadata.description
                           }
                        />
                     </Link>
                  ))}
            </CredenzaBody>
         </CredenzaContent>
      </Credenza>
   );
}
