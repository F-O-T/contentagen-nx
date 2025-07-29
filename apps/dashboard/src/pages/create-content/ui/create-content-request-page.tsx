import { useMutation } from "@tanstack/react-query";
import {
   useNavigate,
   useParams,
   useRouteContext,
} from "@tanstack/react-router";
import { toast } from "sonner";
import { ContentRequestForm } from "@/features/content-request-form/ui/content-request-form";
import type { ContentRequestFormData } from "@/features/content-request-form/lib/use-content-request-form";
import { useTRPC } from "@/integrations/clients";

export function AgentContentRequestPage() {
   const navigate = useNavigate();
   const trpc = useTRPC();
   const { agentId } = useParams({
      from: "/_dashboard/agents/$agentId/content/request",
   });

   // Create mutation for content request
   const contentRequestMutation = useMutation(
      trpc.content.create.mutationOptions(),
   );

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
