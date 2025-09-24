import { Button } from "@packages/ui/components/button";
import { TiptapEditor } from "@packages/ui/components/tiptap-editor";
import { BrandConfigSchema } from "@packages/database/schemas/agent";
import { Markdown } from "@packages/ui/components/markdown";

import type { AgentForm } from "../lib/use-agent-form";
import { translate } from "@packages/localization";

// Example string generator for integration style
const getIntegrationExample = (style: string): string => {
   const brandExamples = {
      strict_guideline: {
         title: translate(
            "pages.agent-creation-form.brand.examples.strict_guideline.title",
         ),
         text: translate(
            "pages.agent-creation-form.brand.examples.strict_guideline.text",
         ),
      },
      flexible_guideline: {
         title: translate(
            "pages.agent-creation-form.brand.examples.flexible_guideline.title",
         ),
         text: translate(
            "pages.agent-creation-form.brand.examples.flexible_guideline.text",
         ),
      },
      reference_only: {
         title: translate(
            "pages.agent-creation-form.brand.examples.reference_only.title",
         ),
         text: translate(
            "pages.agent-creation-form.brand.examples.reference_only.text",
         ),
      },
      creative_blend: {
         title: translate(
            "pages.agent-creation-form.brand.examples.creative_blend.title",
         ),
         text: translate(
            "pages.agent-creation-form.brand.examples.creative_blend.text",
         ),
      },
   } as const;

   const example = brandExamples[style as keyof typeof brandExamples];
   if (example) {
      return `**${example.title}**\n\n${example.text}`;
   }

   return translate("pages.agent-creation-form.brand.examples.default");
};

// Helper function to convert schema values to display labels
const getBrandLabel = (value: string): string => {
   const brandTranslations = {
      strict_guideline: translate(
         "pages.agent-creation-form.brand.options.strict_guideline",
      ),
      flexible_guideline: translate(
         "pages.agent-creation-form.brand.options.flexible_guideline",
      ),
      reference_only: translate(
         "pages.agent-creation-form.brand.options.reference_only",
      ),
      creative_blend: translate(
         "pages.agent-creation-form.brand.options.creative_blend",
      ),
   } as const;

   return brandTranslations[value as keyof typeof brandTranslations] || value;
};

export function BrandStep({ form }: { form: AgentForm }) {
   // Extract the enum values from the schema
   const integrationStyleOptions =
      BrandConfigSchema.shape.integrationStyle.options;

   // Get agentId from form state (assume it's in metadata or similar)

   return (
      <>
         <form.AppField name="brand.integrationStyle">
            {(field) => (
               <field.FieldContainer className="space-y-2">
                  <field.FieldLabel>
                     {translate(
                        "pages.agent-creation-form.brand.integration-style.label",
                     )}
                  </field.FieldLabel>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                     {integrationStyleOptions.map((option) => (
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
                           {getBrandLabel(option)}
                        </button>
                     ))}
                  </div>
                  <field.FieldMessage />

                  {/* Markdown preview for integration style */}
                  {field.state.value && (
                     <div className="mt-4">
                        <div className="text-xs font-semibold mb-1 text-muted-foreground">
                           {translate(
                              "pages.agent-creation-form.brand.example-integration",
                           )}
                        </div>
                        <Markdown
                           content={getIntegrationExample(field.state.value)}
                        />
                     </div>
                  )}
               </field.FieldContainer>
            )}
         </form.AppField>
         <form.AppField name="brand.blacklistWords">
            {(field) => (
               <field.FieldContainer className="space-y-2">
                  <field.FieldLabel>
                     {translate(
                        "pages.agent-creation-form.brand.blacklist-words.label",
                     )}
                  </field.FieldLabel>
                  <TiptapEditor
                     value={
                        form.state.values.brand?.blacklistWords || "<p></p>"
                     }
                     onChange={(val) =>
                        form.setFieldValue("brand.blacklistWords", val)
                     }
                     onBlur={field.handleBlur}
                     name={field.name}
                     id={field.name}
                     placeholder={translate(
                        "pages.agent-creation-form.brand.blacklist-words.placeholder",
                     )}
                     className="w-full"
                     error={
                        field.state.meta.isTouched &&
                        field.state.meta.errors.length > 0
                     }
                  />
                  <field.FieldMessage />
               </field.FieldContainer>
            )}
         </form.AppField>
      </>
   );
}

export function BrandStepSubscribe({
   form,
   next,
}: {
   form: AgentForm;
   next: () => void;
}) {
   return (
      <form.AppField name="brand.integrationStyle">
         {(field) => {
            const value = field.state.value;
            const errors = field.state.meta.errors;
            const isValid = value && (!errors || errors.length === 0);
            return (
               <Button onClick={next} type="button" disabled={!isValid}>
                  {translate("pages.agent-creation-form.actions.next")}
               </Button>
            );
         }}
      </form.AppField>
   );
}
