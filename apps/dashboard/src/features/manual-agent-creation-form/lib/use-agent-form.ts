import { useAppForm } from "@packages/ui/components/form";
import { Value } from "@sinclair/typebox/value";
import { type FormEvent, useCallback } from "react";
import type { PersonaConfig } from "@packages/database/schemas/agent";
import { agentFormSchema } from "../ui/agent-creation-manual-form";
import type { AgentCreationManualForm } from "../ui/agent-creation-manual-form";

export function useAgentForm({
   defaultValues,
   onSubmit,
}: AgentCreationManualForm) {
   const form = useAppForm({
      defaultValues: {
         metadata: { name: "", description: "" },
         audience: { base: "general_public" },
         formatting: {
            toneMix: [],
            formality: 0.5,
            humorLevel: 0.5,
            emojiDensity: 0.5,
            readingGrade: 8,
            communication: "I",
            forbiddenWords: [],
            requiredHooks: [],
         },
         language: { primary: "en" },
         brand: { integrationStyle: "strict_guideline", blacklistWords: [] },
         repurpose: undefined,
         ...defaultValues,
      } as PersonaConfig,
      onSubmit: async ({ value, formApi }) => {
         // Parse brandBlacklistWordsHtml HTML to array if present
         let parsedValue = { ...value };
         if (typeof value.brandBlacklistWordsHtml === "string") {
            // Extract words from HTML string (simple split by <br> or commas, fallback to textContent)
            const html = value.brandBlacklistWordsHtml as string;
            const div = document.createElement("div");
            div.innerHTML = html;
            const text = div.textContent || "";
            // Split by comma, newline, or semicolon
            const arr = text
               .split(/[,;\n]+/)
               .map((w) => w.trim())
               .filter(Boolean);
            parsedValue.brandBlacklistWords = arr;
         }

         // Generate system prompt from persona config
         await onSubmit(parsedValue);
         formApi.reset();
      },
      validators: {
         onBlur: (value) => {
            const valid = Value.Check(agentFormSchema, value);
            if (!valid) {
               const errors = Array.from(Value.Errors(agentFormSchema, value));
               return (
                  errors.map((e) => e.message).join(", ") || "Validation error"
               );
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
