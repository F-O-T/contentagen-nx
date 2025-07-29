import { useMutation } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { ContentRequestForm } from "@/features/content-request-form/ui/content-request-form";
import { useTRPC } from "@/integrations/clients";

export function AgentContentRequestPage() {
   const trpc = useTRPC();
   const { agentId } = useParams({
      from: "/_dashboard/agents/$agentId/content/request",
   });

   // Create mutation for content request
   const contentRequestMutation = useMutation(
      trpc.content.create.mutationOptions(),
   );

   return (
      <ContentRequestForm
         defaultValues={{
            description: "",
         }}
         onSubmit={async (values) => {
            await contentRequestMutation.mutateAsync({
               agentId,
               request: {
                  description: values.description,
               },
            });
         }}
      />
   );
}
