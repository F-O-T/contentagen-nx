import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import {
   useNavigate,
   useParams,
   useRouteContext,
} from "@tanstack/react-router";
import { toast } from "sonner";
import { ContentRequestForm } from "@/features/content-request-form/ui/content-request-form";
import type { ContentRequestFormData } from "@/features/content-request-form/lib/use-content-request-form";

export function EditContentRequestPage() {
   const navigate = useNavigate();
   const { eden } = useRouteContext({
      from: "/_dashboard/content/requests/$requestId/edit",
   });
   const { requestId } = useParams({
      from: "/_dashboard/content/requests/$requestId/edit",
   });

   // Fetch the content request data
   const { data: requestData } = useSuspenseQuery({
      queryKey: ["content-request", requestId],
      queryFn: async () => {
         const response = await eden.api.v1.content.request
            .details({ id: requestId })
            .get();
         return response.data;
      },
   });

   // Update mutation
   const updateMutation = useMutation({
      mutationFn: async (values: ContentRequestFormData) => {
         const response = await eden.api.v1.content.request.patch({
            ...values,
            id: requestId,
         });
         return response.data;
      },
      onSuccess: () => {
         toast.success("Content request updated successfully!");
         navigate({ to: "/content" });
      },
      onError: () => {
         toast.error("Failed to update content request");
      },
   });

   const handleSubmit = async (values: ContentRequestFormData) => {
      await updateMutation.mutateAsync(values);
   };

   return (
      <ContentRequestForm
         defaultValues={{
            topic: requestData?.request.topic,
            briefDescription: requestData?.request.briefDescription,
            targetLength: requestData?.request.targetLength,
            internalLinkFormat: requestData?.request.internalLinkFormat ?? "html",
            includeMetaTags: requestData?.request.includeMetaTags?? false,
            includeMetaDescription: requestData?.request.includeMetaDescription?? false,
         }}
         onSubmit={handleSubmit}
      />
   );
}
