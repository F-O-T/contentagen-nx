import { Input } from "@packages/ui/components/input";
import { Textarea } from "@packages/ui/components/textarea";
import type { AgentForm } from "../lib/use-agent-form";
import { Button } from "@packages/ui/components/button";

export function BasicInfoStep({ form }: { form: AgentForm }) {
   return (
      <>
         <form.AppField name="name">
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
         <form.AppField name="description">
            {(field) => (
               <field.FieldContainer>
                  <field.FieldLabel>Description *</field.FieldLabel>
                  <Textarea
                     id={field.name}
                     name={field.name}
                     onBlur={field.handleBlur}
                     onChange={(e) => field.handleChange(e.target.value)}
                     placeholder="Describe what this agent will do..."
                     rows={3}
                     value={field.state.value}
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
            nameValue: state.values.name,
            descriptionValue: state.values.description,
            fieldMeta: state.fieldMeta,
         })}
      >
         {({ nameValue, descriptionValue, fieldMeta }) => {
            const nameErrors = fieldMeta?.name?.errors;
            const emailErrors = fieldMeta?.description?.errors;

            const isNameValid =
               nameValue?.trim() !== "" &&
               (!nameErrors || nameErrors.length === 0);
            const isEmailValid =
               descriptionValue?.trim() !== "" &&
               (!emailErrors || emailErrors.length === 0);
            const canGoNext = isNameValid && isEmailValid;

            return (
               <Button onClick={next} type="button" disabled={!canGoNext}>
                  Next
               </Button>
            );
         }}
      </form.Subscribe>
   );
}
