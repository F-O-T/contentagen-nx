import { Input } from "@packages/ui/components/input";
import { TiptapEditor } from "@packages/ui/components/tiptap-editor";
import type { AgentForm } from "../lib/use-agent-form";
import { Button } from "@packages/ui/components/button";

export function BasicInfoStep({ form }: { form: AgentForm }) {
   return (
      <div className="space-y-4">
         <form.AppField name="metadata.name">
            {(field) => (
               <field.FieldContainer>
                  <field.FieldLabel>Agent Name *</field.FieldLabel>
                  <Input
                     autoComplete="off"
                     id={field.name}
                     name={field.name}
                     onBlur={field.handleBlur}
                     onChange={(e) => field.handleChange(e.target.value)}
                     placeholder="e.g., Tech News Agent"
                     value={field.state.value}
                     className="w-full"
                  />
                  <field.FieldMessage />
               </field.FieldContainer>
            )}
         </form.AppField>
         <form.AppField name="metadata.description">
            {(field) => (
               <field.FieldContainer>
                  <field.FieldLabel>Description *</field.FieldLabel>
                  <TiptapEditor
                     value={field.state.value || "<p></p>"}
                     onChange={(val) => {
                        field.handleChange(val);
                     }}
                     onBlur={field.handleBlur}
                     name={field.name}
                     id={field.name}
                     placeholder="Describe what this agent does..."
                     className="w-full"
                  />
                  <field.FieldMessage />
               </field.FieldContainer>
            )}
         </form.AppField>
      </div>
   );
}

export function BasicInfoStepSubscribe({
   form,
   next,
}: {
   form: AgentForm;
   next: () => void;
}) {
   return (
      <form.Subscribe
         selector={(state) => ({
            nameValue: state.values.metadata?.name,
            descriptionValue: state.values.metadata?.description,
            fieldMeta: state.fieldMeta,
         })}
      >
         {({ nameValue, descriptionValue, fieldMeta }) => {
            const nameErrors =
               fieldMeta?.["metadata.name"] &&
               typeof fieldMeta["metadata.name"] === "object" &&
               fieldMeta["metadata.name"] !== null &&
               "errors" in fieldMeta["metadata.name"]
                  ? (fieldMeta["metadata.name"] as { errors?: string[] }).errors
                  : undefined;
            const descriptionErrors =
               fieldMeta?.["metadata.description"] &&
               typeof fieldMeta["metadata.description"] === "object" &&
               fieldMeta["metadata.description"] !== null &&
               "errors" in fieldMeta["metadata.description"]
                  ? (fieldMeta["metadata.description"] as { errors?: string[] })
                       .errors
                  : undefined;
            const isNameValid =
               nameValue?.trim() !== "" &&
               (!nameErrors || nameErrors.length === 0);

            // Helper function to check if TipTap content is empty
            const isContentEmpty = (htmlContent: string | undefined) => {
               if (!htmlContent) return true;
               // Remove HTML tags and check if there's actual text content
               const textContent = htmlContent.replace(/<[^>]*>/g, "").trim();
               return textContent === "";
            };

            const isDescriptionValid =
               !isContentEmpty(descriptionValue) &&
               (!descriptionErrors || descriptionErrors.length === 0);
            const canGoNext = isNameValid && isDescriptionValid;

            return (
               <Button onClick={next} type="button" disabled={!canGoNext}>
                  Next
               </Button>
            );
         }}
      </form.Subscribe>
   );
}
