import { useAppForm } from "@packages/ui/components/form";
import { Value } from "@sinclair/typebox/value";
import { type FormEvent, useCallback } from "react";
import {
  type AgentCreationManualForm,
  type AgentFormData,
  agentFormSchema,
} from "../ui/agent-creation-manual-form";

export function useAgentForm({
  defaultValues,
  onSubmit,
}: AgentCreationManualForm) {
  const form = useAppForm({
    defaultValues: {
      contentType: "blog_posts",
      description: "",
      formattingStyle: "structured",
      name: "",
      targetAudience: "general_public",
      voiceTone: "professional",
      brandIntegration: "strict_guideline",
      communicationStyle: "first_person", // Added default value
      language: "english",
      systemPrompt: "",
      ...defaultValues,
    } as AgentFormData,
    onSubmit: async ({ value, formApi }) => {
      await onSubmit(value);
      formApi.reset();
    },
    validators: {
      onBlur: (value) => {
        const valid = Value.Check(agentFormSchema, value);
        if (!valid) {
          const errors = Array.from(Value.Errors(agentFormSchema, value));
          return errors.map((e) => e.message).join(", ") || "Validation error";
        }
        return undefined;
      },
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
export type AgentForm = ReturnType<typeof useAgentForm>["form"];
