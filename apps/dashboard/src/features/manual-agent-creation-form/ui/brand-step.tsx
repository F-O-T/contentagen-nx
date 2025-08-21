import { Button } from "@packages/ui/components/button";
import { TiptapEditor } from "@packages/ui/components/tiptap-editor";
import { BrandConfigSchema } from "@packages/database/schemas/agent";
import { Markdown } from "@packages/ui/components/markdown";

import type { AgentForm } from "../lib/use-agent-form";

// Example string generator for integration style
const getIntegrationExample = (style: string): string => {
   switch (style) {
      case "strict_guideline":
         return "**Strict Guideline Example:**\n\nAll content must strictly follow brand guidelines and use only approved messaging.\nExplicitly include the brand name at least once in every response.";
      case "flexible_guideline":
         return "**Flexible Guideline Example:**\n\nUse brand guidelines as a foundation, but adapt tone and style for context and audience.\nNaturally incorporate the brand name and products in a way that feels organic.";
      case "reference_only":
         return "**Reference Only Example:**\n\nTreat the brand document as background knowledge.\nMention brand solutions only when directly relevant to the user's needs.";
      case "creative_blend":
         return "**Creative Blend Example:**\n\nUse brand personality traits as inspiration for creative storytelling.\nIntegrate brand elements naturally into the narrative.";
      default:
         return "Sample integration message for the selected style.";
   }
};

// Helper function to convert schema values to display labels
const getBrandLabel = (value: string): string => {
   return value.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
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
                  <field.FieldLabel>Integration Style *</field.FieldLabel>
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
                           Example Integration
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
                     Blacklist Words (optional)
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
                     placeholder="Enter words to avoid..."
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
                  Next
               </Button>
            );
         }}
      </form.AppField>
   );
}
