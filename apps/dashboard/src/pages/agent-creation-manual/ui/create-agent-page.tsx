import { AgentCreationManualForm } from "@/features/agent-creation-manual-form/ui/agent-creation-manual-form";
import type { EdenClientType } from "@packages/eden";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useRouteContext } from "@tanstack/react-router";
type Values = Partial<
   Omit<
      Awaited<EdenClientType["api"]["v1"]["agents"]["post"]>["data"],
      "id" | "createdAt" | "ownerId"
   >
>;
export function CreateAgentPage() {
   const navigate = useNavigate();
   const { eden } = useRouteContext({
      from: "/_dashboard/agents/_flow/manual",
   });

   const agentMutation = useMutation({
      mutationFn: (values: Values) => eden.api.v1.agents.post(values),
      onSuccess: () => {
         navigate({ to: "/agents" });
      },
   });
   return (
      <AgentCreationManualForm
         onSubmit={async (values) => {
            await agentMutation.mutateAsync(values);
         }}
      />
   );
}
