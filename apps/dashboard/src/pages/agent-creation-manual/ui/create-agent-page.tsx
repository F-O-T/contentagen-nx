import { AgentCreationManualForm } from "@/features/manual-agent-creation-form/ui/agent-creation-manual-form";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useRouteContext } from "@tanstack/react-router";
import { toast } from "sonner";
export function CreateAgentPage() {
   const navigate = useNavigate();
   const { eden } = useRouteContext({
      from: "/_dashboard/agents/_flow/manual",
   });

   const agentMutation = useMutation({
      mutationFn: eden.api.v1.agents.post,
      onError: (error) => {
         console.error("Error creating agent:", error);
         toast.error("Failed to create agent");
      },
      onSuccess: () => {
         toast.success("Agent created successfully!");

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
