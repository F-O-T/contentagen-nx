import { AgentCreationManualForm } from "@/features/manual-agent-creation-form/ui/agent-creation-manual-form";
import { useTRPC } from "@/integrations/clients";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
export function CreateAgentPage() {
   const navigate = useNavigate();
   const trpc = useTRPC();
   const agentMutation = useMutation(
      trpc.agent.create.mutationOptions({
         onSuccess: () => {
            toast.success("Agent created successfully!");
            navigate({
               to: "/agents",
            });
         },
         onError: (error) => {
            console.error("Error creating agent:", error);
            toast.error("Failed to create agent");
         },
      }),
   );
   return (
      <AgentCreationManualForm
         onSubmit={async (values) => {
            await agentMutation.mutateAsync(values);
         }}
      />
   );
}
