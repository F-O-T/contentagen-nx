import { ContentRequestSchema } from "@packages/database/schema";
import type { ContentRequestForm } from "../lib/use-content-request-form";
import { Button } from "@packages/ui/components/button";
import { TiptapEditor } from "@packages/ui/components/tiptap-editor";
import { translate } from "@packages/localization";

const getLayoutLabel = (value: string): string => {
   return value.charAt(0).toUpperCase() + value.slice(1);
};

export function BasicInfoStep({ form }: { form: ContentRequestForm }) {
   const layoutOptions = ContentRequestSchema.shape.layout.options;

   return (
      <div className="space-y-4">
         <form.AppField name="description">
            {(field) => (
               <field.FieldContainer>
                  <field.FieldLabel>
                     {translate(
                        "pages.content-request-form.basic-info.headline.label",
                     )}
                  </field.FieldLabel>
                  <TiptapEditor
                     id={field.name}
                     name={field.name}
                     value={field.state.value}
                     onChange={field.handleChange}
                     onBlur={field.handleBlur}
                     placeholder={translate(
                        "pages.content-request-form.basic-info.headline.placeholder",
                     )}
                  />
                  <field.FieldMessage />
               </field.FieldContainer>
            )}
         </form.AppField>

         <form.AppField name="layout">
            {(field) => (
               <field.FieldContainer className="space-y-2">
                  <field.FieldLabel>
                     {translate(
                        "pages.content-request-form.basic-info.layout.label",
                     )}
                  </field.FieldLabel>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                     {layoutOptions.map((option) => (
                        <button
                           className={`group relative rounded-lg border-2 p-4 text-sm font-medium transition-all hover:shadow-sm ${
                              field.state.value === option
                                 ? "border-primary bg-primary/5 text-primary shadow-sm"
                                 : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
                           }`}
                           key={option}
                           onClick={() => {
                              field.handleChange(option);
                              field.handleBlur();
                           }}
                           type="button"
                        >
                           {getLayoutLabel(option)}
                        </button>
                     ))}
                  </div>
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
   form: ContentRequestForm;
   next: () => void;
}) {
   return (
      <form.Subscribe
         selector={(state) => ({
            descriptionValue: state.values.description,
            layoutValue: state.values.layout,
            fieldMeta: state.fieldMeta,
         })}
      >
         {({ descriptionValue, layoutValue, fieldMeta }) => {
            const descriptionErrors = fieldMeta?.description?.errors;
            const layoutErrors = fieldMeta?.layout?.errors;

            const isBriefDescriptionValid =
               descriptionValue.trim() !== "" &&
               (!descriptionErrors || descriptionErrors.length === 0);
            const isLayoutValid =
               layoutValue && (!layoutErrors || layoutErrors.length === 0);
            const canGoNext = isBriefDescriptionValid && isLayoutValid;

            return (
               <Button onClick={next} type="button" disabled={!canGoNext}>
                  {translate("pages.content-request-form.actions.next")}
               </Button>
            );
         }}
      </form.Subscribe>
   );
}
