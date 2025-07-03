import { useMutation } from "@tanstack/react-query";
import {
   useNavigate,
   useParams,
   useRouteContext,
} from "@tanstack/react-router";
import { toast } from "sonner";
import { ContentRequestForm } from "@/features/content-request-form/ui/content-request-form";
import type { ContentRequestFormData } from "@/features/content-request-form/lib/use-content-request-form";

export function AgentContentRequestPage() {
   const navigate = useNavigate();
   const { eden } = useRouteContext({
      from: "/_dashboard/agents/$agentId/content/request",
   });
   const { agentId } = useParams({
      from: "/_dashboard/agents/$agentId/content/request",
   });

   // Create mutation for content request
   const contentRequestMutation = useMutation({
      mutationFn: async (values: ContentRequestFormData) => {
         const response = await eden.api.v1.content.request.post({
            ...values,
            agentId,
         });
         return response.data;
      },
      onSuccess: () => {
         toast.success("Content request submitted successfully!");
         navigate({ to: "/content" });
      },
      onError: () => {
         toast.error("Failed to submit content request");
      },
   });

   const handleSubmit = async (values: ContentRequestFormData) => {
      await contentRequestMutation.mutateAsync(values);
   };

   return (
      <ContentRequestForm
         defaultValues={{
            topic: "",
            briefDescription: "",
         }}
         onSubmit={handleSubmit}
      />
   );
}
