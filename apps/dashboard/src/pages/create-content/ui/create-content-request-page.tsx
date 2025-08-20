import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "@tanstack/react-router";
import { ContentRequestForm } from "@/features/content-request-form/ui/content-request-form";
import { useTRPC } from "@/integrations/clients";
import { toast } from "sonner";

export function AgentContentRequestPage() {
   const trpc = useTRPC();
   const state = useRouter();
   const { agentId } = useParams({
      from: "/_dashboard/agents/$agentId/content/request",
   });
   const queryClient = useQueryClient();
   // Create mutation for content request
   const contentRequestMutation = useMutation(
      trpc.content.create.mutationOptions({
         onSuccess: (data) => {
            toast.success("Content begun generation successfully!");
            queryClient.invalidateQueries({
               queryKey: trpc.content.listAllContent.queryKey({
                  status: [
                     "draft",
                     "approved",
                     "planning",
                     "researching",
                     "writing",
                     "editing",
                     "analyzing",
                  ],
               }),
            });
            if (!data?.id) return state.history.back();
            state.navigate({
               to: "/content/$id",
               params: { id: data.id },
            });
         },
         onError: (error) => {
            console.error("Failed to create content request:", error);
            toast.error(`Failed to create content`);
         },
      }),
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
