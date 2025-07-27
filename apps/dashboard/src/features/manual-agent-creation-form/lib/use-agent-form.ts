import { useAppForm } from "@packages/ui/components/form";
import { type FormEvent, useCallback } from "react";
import type { PersonaConfig } from "@packages/database/schemas/agent-types";
import type { AgentCreationManualForm } from "../ui/agent-creation-manual-form";
import { AgentInsertSchema } from "@packages/database/schema";

export function useAgentForm({
   defaultValues,
   onSubmit,
}: AgentCreationManualForm) {
   const schema = AgentInsertSchema;
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
         onBlur: schema.omit({
            id: true, // Assuming 'id' is auto-generated and not needed in the form
         }),
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
