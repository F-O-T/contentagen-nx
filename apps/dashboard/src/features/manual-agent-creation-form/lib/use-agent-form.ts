import { useAppForm } from "@packages/ui/components/form";
import { type FormEvent, useCallback } from "react";
import {
   type PersonaConfig,
   PersonaConfigSchema,
} from "@packages/database/schemas/agent";
import type { AgentCreationManualForm } from "../ui/agent-creation-manual-form";

export function useAgentForm({
   defaultValues,
   onSubmit,
}: AgentCreationManualForm) {
   const form = useAppForm({
      defaultValues: {
         metadata: { name: "", description: "" },
         instructions: {
            audienceProfile: "",
            writingGuidelines: "",
            ragIntegration: "",
         },
         purpose: "blog_post",
         ...defaultValues,
      } as PersonaConfig,
      onSubmit: async ({ value, formApi }) => {
         await onSubmit(value);
         formApi.reset();
      },
      validators: {
         onBlur: PersonaConfigSchema,
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
