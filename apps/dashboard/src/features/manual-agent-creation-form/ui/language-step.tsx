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

// Helper function to convert schema values to display labels
const getLanguageLabel = (value: string): string => {
   const languageMap: Record<string, string> = {
      en: "English",
      pt: "Portuguese",
      es: "Spanish",
      "en-US": "English (US)",
      "en-GB": "English (UK)",
      "pt-BR": "Portuguese (Brazil)",
      "pt-PT": "Portuguese (Portugal)",
      "es-ES": "Spanish (Spain)",
      "es-MX": "Spanish (Mexico)",
   };
   return languageMap[value] || value;
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
                  <field.FieldLabel>Primary Language *</field.FieldLabel>
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
                     <field.FieldLabel>Variant (optional)</field.FieldLabel>
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
                                    ? "Select variant..."
                                    : "Select primary language first"
                              }
                           />
                        </SelectTrigger>
                        <SelectContent>
                           <SelectItem value="none">None</SelectItem>
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
                  Next
               </Button>
            );
         }}
      </form.AppField>
   );
}
