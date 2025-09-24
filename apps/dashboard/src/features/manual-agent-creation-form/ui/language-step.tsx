import { Button } from "@packages/ui/components/button";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@packages/ui/components/select";
import { LanguageConfigSchema } from "@packages/database/schemas/agent";
import type { AgentForm } from "../lib/use-agent-form";
import { translate } from "@packages/localization";

// Helper function to convert schema values to display labels
const getLanguageLabel = (value: string): string => {
   const languageTranslations = {
      en: translate("pages.agent-creation-form.language.languages.english"),
      pt: translate("pages.agent-creation-form.language.languages.portuguese"),
      es: translate("pages.agent-creation-form.language.languages.spanish"),
      "en-US": translate(
         "pages.agent-creation-form.language.languages.english-us",
      ),
      "en-GB": translate(
         "pages.agent-creation-form.language.languages.english-uk",
      ),
      "pt-BR": translate(
         "pages.agent-creation-form.language.languages.portuguese-brazil",
      ),
      "pt-PT": translate(
         "pages.agent-creation-form.language.languages.portuguese-portugal",
      ),
      "es-ES": translate(
         "pages.agent-creation-form.language.languages.spanish-spain",
      ),
      "es-MX": translate(
         "pages.agent-creation-form.language.languages.spanish-mexico",
      ),
   } as const;

   return (
      languageTranslations[value as keyof typeof languageTranslations] || value
   );
};

export function LanguageStep({ form }: { form: AgentForm }) {
   // Extract the enum values from the schema
   const primaryLanguageOptions = LanguageConfigSchema.shape.primary.options;
   const variantOptions = LanguageConfigSchema.shape.variant.unwrap().options;

   return (
      <div className="space-y-4">
         <form.AppField name="language.primary">
            {(field) => (
               <field.FieldContainer className="space-y-2">
                  <field.FieldLabel>
                     {translate(
                        "pages.agent-creation-form.language.primary-language.label",
                     )}
                  </field.FieldLabel>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                     {primaryLanguageOptions.map((option) => (
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
                              // Clear variant when primary language changes
                              form.setFieldValue("language.variant", undefined);
                           }}
                           type="button"
                        >
                           {getLanguageLabel(option)}
                        </button>
                     ))}
                  </div>
                  <field.FieldMessage />
               </field.FieldContainer>
            )}
         </form.AppField>
         <form.AppField name="language.variant">
            {(field) => {
               // Get the selected primary language to filter variants
               const primaryLanguage = form.getFieldValue("language.primary");
               const filteredVariants = variantOptions.filter((variant) =>
                  primaryLanguage ? variant.startsWith(primaryLanguage) : true,
               );

               return (
                  <field.FieldContainer className="space-y-2">
                     <field.FieldLabel>
                        {translate(
                           "pages.agent-creation-form.language.variant.label",
                        )}
                     </field.FieldLabel>
                     <Select
                        value={field.state.value || "none"}
                        onValueChange={(value) => {
                           if (value === "none") {
                              field.handleChange(undefined);
                           } else {
                              field.handleChange(
                                 value as (typeof variantOptions)[number],
                              );
                           }
                        }}
                        onOpenChange={(open) => {
                           if (!open) {
                              field.handleBlur();
                           }
                        }}
                        disabled={!primaryLanguage}
                     >
                        <SelectTrigger className="w-full">
                           <SelectValue
                              placeholder={
                                 primaryLanguage
                                    ? translate(
                                         "pages.agent-creation-form.language.variant.placeholder",
                                      )
                                    : translate(
                                         "pages.agent-creation-form.language.variant.placeholder-select-language",
                                      )
                              }
                           />
                        </SelectTrigger>
                        <SelectContent>
                           <SelectItem value="none">
                              {translate(
                                 "pages.agent-creation-form.language.none",
                              )}
                           </SelectItem>
                           {filteredVariants.map((variant) => (
                              <SelectItem key={variant} value={variant}>
                                 {getLanguageLabel(variant)}
                              </SelectItem>
                           ))}
                        </SelectContent>
                     </Select>
                     <field.FieldMessage />
                  </field.FieldContainer>
               );
            }}
         </form.AppField>
      </div>
   );
}

export function LanguageStepSubscribe({
   form,
   next,
}: {
   form: AgentForm;
   next: () => void;
}) {
   return (
      <form.AppField name="language.primary">
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
