import { AgentCreationManualForm } from "@/features/manual-agent-creation-form/ui/agent-creation-manual-form";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useEden } from "@/integrations/eden";
export function CreateAgentPage() {
   const navigate = useNavigate();
   const { eden } = useEden();
   type Values = Parameters<typeof eden.api.v1.agents.post>[0];
   const mutation = async (values: Values) => {
      try {
         const { data, error } = await eden.api.v1.agents.post(values);
         if (error) {
            throw new Error(error.value.message);
         }
         return data;
      } catch (error) {
         console.error("Error creating agent:", error);
         throw error;
      }
   };
   const agentMutation = useMutation({
      mutationFn: mutation,
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
   });
   return (
      <AgentCreationManualForm
         onSubmit={async (values) => {
            await agentMutation.mutateAsync(values);
         }}
      />
   );
}
