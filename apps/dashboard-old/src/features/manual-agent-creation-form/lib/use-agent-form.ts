import { useAppForm } from "@packages/ui/components/form";
import { Value } from "@sinclair/typebox/value";
import { type FormEvent, useCallback } from "react";
import type { PersonaConfig } from "@packages/database/schemas/agent-types";
import { agentFormSchema } from "../ui/agent-creation-manual-form";
import type { AgentCreationManualForm } from "../ui/agent-creation-manual-form";

export function useAgentForm({
  defaultValues,
  onSubmit,
}: AgentCreationManualForm) {
  const form = useAppForm({
    defaultValues: {
      metadata: { name: "", description: "" },
      voice: { communication: "I" },
      audience: { base: "general_public" },
      formatting: { style: "structured" },
      language: { primary: "en" },
      brand: { integrationStyle: "strict_guideline" },
      purpose: undefined,
      ...defaultValues,
    } as PersonaConfig,
    onSubmit: async ({ value, formApi }) => {
      // No custom parsing needed, just submit the PersonaConfig as is
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
