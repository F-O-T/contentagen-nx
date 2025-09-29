import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "@tanstack/react-router";
import { ContentRequestForm } from "@/features/content-request-form/ui/content-request-form";
import { useTRPC } from "@/integrations/clients";
import { toast } from "sonner";
import { translate } from "@packages/localization";

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
            toast.success(
               translate(
                  "pages.content-request-form.messages.generation-started",
               ),
            );
            queryClient.invalidateQueries({
               queryKey: trpc.content.listAllContent.queryKey({
                  status: ["draft", "approved"],
               }),
            });
            if (!data?.id) return state.history.back();
            state.navigate({
               to: "/content/$id",
               params: { id: data.id },
               search: { page: 1 },
            });
         },
         onError: (error) => {
            console.error("Failed to create content request:", error);
            toast.error(
               translate("pages.content-request-form.messages.creation-failed"),
            );
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
                  layout: values.layout,
               },
            });
         }}
      />
   );
}
