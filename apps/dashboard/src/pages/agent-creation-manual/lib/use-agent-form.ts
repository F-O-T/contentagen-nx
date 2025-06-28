import {
   contentTypeEnum,
   formattingStyleEnum,
   targetAudienceEnum,
   voiceToneEnum,
} from "@api/schemas/content-schema";
import { useAppForm } from "@packages/ui/components/form";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, useRouteContext } from "@tanstack/react-router";
import { type FormEvent, useCallback } from "react";
import { z } from "zod";

const agentFormSchema = z.object({
   contentType: z.enum(contentTypeEnum.enumValues, {
      required_error: "Content type is required",
   }),
   description: z.string().min(1, "Description is required"),
   formattingStyle: z.enum(formattingStyleEnum.enumValues).optional(),
   name: z.string().min(1, "Agent name is required"),

   seoKeywords: z.array(z.string()),
   targetAudience: z.enum(targetAudienceEnum.enumValues, {
      required_error: "Target audience is required",
   }),
   topics: z.array(z.string()),
   voiceTone: z.enum(voiceToneEnum.enumValues, {
      required_error: "Voice tone is required",
   }),
});
export type AgentFormData = z.infer<typeof agentFormSchema>;
export function useAgentForm() {
   const navigate = useNavigate();
   const { eden } = useRouteContext({
      from: "/_dashboard/agents/_flow/manual",
   });

   const agentMutation = useMutation({
      mutationFn: eden.api.v1.agents.post,
      onSuccess: () => {
         navigate({ to: "/agents" });
      },
   });

   const form = useAppForm({
      defaultValues: {
         contentType: "blog_posts",
         description: "",
         formattingStyle: "structured",
         name: "",
         seoKeywords: [],
         targetAudience: "general_public",
         topics: [],
         voiceTone: "professional",
      } as AgentFormData,
      onSubmit: async ({ value, formApi }) => {
         console.log("Submitting agent form", value);
         await agentMutation.mutateAsync(value);
         formApi.reset();
      },
      validators: {
         onBlur: agentFormSchema,
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
      isLoading: agentMutation.isPending,
   };
}
export type AgentForm = ReturnType<typeof useAgentForm>["form"];
