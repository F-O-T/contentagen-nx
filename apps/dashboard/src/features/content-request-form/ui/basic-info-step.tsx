import { Input } from "@packages/ui/components/input";
import { Textarea } from "@packages/ui/components/textarea";
import type { ContentRequestForm } from "../lib/use-content-request-form";
import { Button } from "@packages/ui/components/button";

export function BasicInfoStep({ form }: { form: ContentRequestForm }) {
   return (
      <>
         <form.AppField name="topic">
            {(field) => (
               <field.FieldContainer>
                  <field.FieldLabel>Topic *</field.FieldLabel>
                  <Input
                     autoComplete="off"
                     id={field.name}
                     name={field.name}
                     onBlur={field.handleBlur}
                     onChange={(e) => field.handleChange(e.target.value)}
                     placeholder="e.g., Artificial Intelligence in Healthcare"
                     value={field.state.value}
                  />
                  <field.FieldMessage />
               </field.FieldContainer>
            )}
         </form.AppField>
         <form.AppField name="briefDescription">
            {(field) => (
               <field.FieldContainer>
                  <field.FieldLabel>Brief Description *</field.FieldLabel>
                  <Textarea
                     id={field.name}
                     name={field.name}
                     onBlur={field.handleBlur}
                     onChange={(e) => field.handleChange(e.target.value)}
                     placeholder="Describe what you want the content to cover..."
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
   form: ContentRequestForm;
   next: () => void;
}) {
   return (
      <form.Subscribe
         selector={(state) => ({
            topicValue: state.values.topic,
            briefDescriptionValue: state.values.briefDescription,
            fieldMeta: state.fieldMeta,
         })}
      >
         {({ topicValue, briefDescriptionValue, fieldMeta }) => {
            const topicErrors = fieldMeta?.topic?.errors;
            const briefDescriptionErrors = fieldMeta?.briefDescription?.errors;

            const isTopicValid =
               topicValue?.trim() !== "" &&
               (!topicErrors || topicErrors.length === 0);
            const isBriefDescriptionValid =
               briefDescriptionValue?.trim() !== "" &&
               (!briefDescriptionErrors || briefDescriptionErrors.length === 0);
            const canGoNext = isTopicValid && isBriefDescriptionValid;

            return (
               <Button onClick={next} type="button" disabled={!canGoNext}>
                  Next
               </Button>
            );
         }}
      </form.Subscribe>
   );
}
