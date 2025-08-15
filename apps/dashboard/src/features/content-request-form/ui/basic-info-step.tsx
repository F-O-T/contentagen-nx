import type { ContentRequestForm } from "../lib/use-content-request-form";
import { Button } from "@packages/ui/components/button";
import { TiptapEditor } from "@packages/ui/components/tiptap-editor";

export function BasicInfoStep({ form }: { form: ContentRequestForm }) {
   return (
      <form.AppField name="description">
         {(field) => (
            <field.FieldContainer>
               <field.FieldLabel>Headline *</field.FieldLabel>
               <TiptapEditor
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onChange={field.handleChange}
                  onBlur={field.handleBlur}
                  placeholder="Describe what you want the content to cover..."
               />
               <field.FieldMessage />
            </field.FieldContainer>
         )}
      </form.AppField>
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
            descriptionValue: state.values.description,
            fieldMeta: state.fieldMeta,
         })}
      >
         {({ descriptionValue, fieldMeta }) => {
            const descriptionErrors = fieldMeta?.description?.errors;

            const isBriefDescriptionValid =
               descriptionValue.trim() !== "" &&
               (!descriptionErrors || descriptionErrors.length === 0);
            const canGoNext = isBriefDescriptionValid;

            return (
               <Button onClick={next} type="button" disabled={!canGoNext}>
                  Next
               </Button>
            );
         }}
      </form.Subscribe>
   );
}
