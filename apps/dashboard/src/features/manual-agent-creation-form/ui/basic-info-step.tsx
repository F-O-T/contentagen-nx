import { Input } from "@packages/ui/components/input";
import { TiptapEditor } from "@packages/ui/components/tiptap-editor";
import type { AgentForm } from "../lib/use-agent-form";
import { Button } from "@packages/ui/components/button";

export function BasicInfoStep({ form }: { form: AgentForm }) {
   return (
      <>
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
                     value={
                        form.state.values.metadata?.description || "<p></p>"
                     }
                     onChange={(val) =>
                        form.setFieldValue("metadata.description", val)
                     }
                     onBlur={field.handleBlur}
                     name={field.name}
                     id={field.name}
                     placeholder="Describe what this agent does..."
                     minHeight="200px"
                  />
                  <field.FieldMessage />
               </field.FieldContainer>
            )}
         </form.AppField>
      </>
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
               fieldMeta?.metadata &&
               typeof fieldMeta.metadata.name === "object" &&
               fieldMeta.metadata.name !== null &&
               "errors" in fieldMeta.metadata.name
                  ? (fieldMeta.metadata.name as { errors?: string[] }).errors
                  : undefined;
            const descriptionErrors =
               fieldMeta?.metadata &&
               typeof fieldMeta.metadata.description === "object" &&
               fieldMeta.metadata.description !== null &&
               "errors" in fieldMeta.metadata.description
                  ? (fieldMeta.metadata.description as { errors?: string[] })
                       .errors
                  : undefined;
            const isNameValid =
               nameValue?.trim() !== "" &&
               (!nameErrors || nameErrors.length === 0);
            const isDescriptionValid =
               descriptionValue?.trim() !== "" &&
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
