import { useAppForm } from "@packages/ui/components/form";
import { type FormEvent, useCallback } from "react";
import { z } from "zod";
import { contentLengthEnum } from "@api/schemas/content-schema";
import { useMutation } from "@tanstack/react-query";
import {
   useNavigate,
   useRouteContext,
   useParams,
} from "@tanstack/react-router";
import { toast } from "sonner";

export const contentRequestFormSchema = z.object({
   topic: z.string().min(1, "Topic is required"),
   briefDescription: z.string().min(1, "Brief description is required"),
   targetLength: z.enum(contentLengthEnum.enumValues, {
      required_error: "Target length is required",
   }),
});

export type ContentRequestFormData = z.infer<typeof contentRequestFormSchema>;

export type ContentRequestForm = ReturnType<
   typeof useContentRequestForm
>["form"];

export type ContentRequestFormProps = {
   defaultValues?: Partial<ContentRequestFormData>;
   onSubmit: (values: ContentRequestFormData) => Promise<void>;
};

export function useContentRequestForm() {
   const navigate = useNavigate();
   const { eden } = useRouteContext({
      from: "/_dashboard/agents/$agentId/content/request",
   });
   const { agentId } = useParams({
      from: "/_dashboard/agents/$agentId/content/request",
   });

   const contentRequestMutation = useMutation({
      mutationFn: eden.api.v1.content.request.generate.post,
      onSuccess: () => {
         toast.success("Content request submitted successfully!");
         navigate({ to: "/agents" });
      },
      onError: () => {
         toast.error("Failed to submit content request");
      },
   });

   const form = useAppForm({
      defaultValues: {
         topic: "",
         briefDescription: "",
         targetLength: "medium",
         agentId: "",
      } as ContentRequestFormData,
      onSubmit: async ({ value, formApi }) => {
         await contentRequestMutation.mutateAsync({
            ...value,
            agentId,
         });
         formApi.reset();
      },
      validators: {
         onBlur: contentRequestFormSchema,
      },
   });

   const handleSubmit = useCallback(
      (e: FormEvent) => {
         e.preventDefault();
         e.stopPropagation();
         form.handleSubmit();
      },
      [form],
   );

   return {
      form,
      handleSubmit,
   };
}
