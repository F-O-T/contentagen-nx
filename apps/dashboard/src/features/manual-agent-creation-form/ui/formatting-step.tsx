import { Button } from "@packages/ui/components/button";
import { FormatConfigSchema } from "@packages/database/schemas/agent";
import { Markdown } from "@packages/ui/components/markdown";

import type { AgentForm } from "../lib/use-agent-form";
import { translate } from "@packages/localization";

// Helper function to convert schema values to display labels
const getFormatLabel = (value: string): string => {
   const translationKey = `pages.agent-creation-form.formatting.options.${value}`;
   return translate(translationKey);
};

// Example string generator for formatting style
const getFormattingExample = (style: string, listStyle?: string): string => {
   // Generate translated list style examples
   let listStyleExample = "";
   if (listStyle === "bullets") {
      const title = translate(
         "pages.agent-creation-form.formatting.examples.list-style.bullets.title",
      );
      const items = translate(
         "pages.agent-creation-form.formatting.examples.list-style.bullets.items",
      ) as string[];
      listStyleExample = `**${title}**\n- ${items[0]}\n- ${items[1]}\n- ${items[2]}`;
   } else if (listStyle === "numbered") {
      const title = translate(
         "pages.agent-creation-form.formatting.examples.list-style.numbered.title",
      );
      const items = translate(
         "pages.agent-creation-form.formatting.examples.list-style.numbered.items",
      ) as string[];
      listStyleExample = `**${title}**\n1. ${items[0]}\n2. ${items[1]}\n3. ${items[2]}`;
   }

   if (style === "structured") {
      return `# [Main Title with Primary Benefit]

## The Challenge: [Specific Problem]
- Pain point identification
- Cost of inaction
- Current solution limitations

## The Solution: [Specific Approach]
### Step 1: [Action with Outcome]
### Step 2: [Action with Outcome]
### Step 3: [Action with Outcome]

## Implementation Guide
- Resource requirements
- Timeline expectations
- Success metrics

## Results & Next Steps
- Expected outcomes
- Immediate actions
- Long-term strategy
${listStyle ? `\n**List Style Preference:** Use ${listStyle} formatting for all lists and enumerated items.\n\n${listStyleExample}` : ""}`;
   }
   if (style === "narrative") {
      return `# Narrative Example: Overcoming the Challenge

When I first encountered this problem, I felt overwhelmed. The obstacles seemed insurmountable, and every failed attempt added to my frustration. But through persistence and creative thinking, I discovered a solution that changed everything. The turning point came when I realized the importance of breaking the problem into smaller steps. Each small victory built my confidence, and soon the challenge became an opportunity for growth.

> "Stories activate empathy and memory centers in the brain."

${listStyle ? `\n**List Style Preference:** Use ${listStyle} formatting for any lists in the story.\n\n${listStyleExample}` : ""}`;
   }
   if (style === "list_based") {
      if (listStyle === "numbered") {
         return `# Action Steps for Success

1. Define your goal
2. Gather resources
3. Take the first step
4. Review progress
5. Adjust and repeat

**Preferred List Style:** Use numbered formatting for all primary lists.\n\n${listStyleExample}`;
      }
      // Default to bullets
      return `# Key Points for Implementation

- Set clear objectives
- Identify obstacles
- Develop solutions
- Track progress
- Celebrate achievements

**Preferred List Style:** Use bullet formatting for all primary lists.\n\n${listStyleExample}`;
   }
   // If only listStyle is selected, show its example
   if (listStyle) {
      return listStyleExample;
   }
   return translate("pages.agent-creation-form.formatting.examples.fallback");
};

export function FormattingStep({ form }: { form: AgentForm }) {
   // Extract the enum values from the schema
   const styleOptions = FormatConfigSchema.shape.style.options;
   const listStyleOptions = FormatConfigSchema.shape.listStyle.unwrap().options;

   return (
      <div className="space-y-4">
         <form.AppField name="formatting.style">
            {(field) => (
               <field.FieldContainer className="space-y-2">
                  <field.FieldLabel>
                     {translate(
                        "pages.agent-creation-form.formatting.style.label",
                     )}
                  </field.FieldLabel>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                     {styleOptions.map((option) => (
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
                           {getFormatLabel(option)}
                        </button>
                     ))}
                  </div>
                  <field.FieldMessage />
               </field.FieldContainer>
            )}
         </form.AppField>
         <form.AppField name="formatting.listStyle">
            {(field) => (
               <field.FieldContainer className="space-y-2">
                  <field.FieldLabel>
                     {translate(
                        "pages.agent-creation-form.formatting.list-style",
                     )}
                  </field.FieldLabel>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                     {listStyleOptions.map((option) => (
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
                           {getFormatLabel(option)}
                        </button>
                     ))}
                  </div>
                  <field.FieldMessage />
               </field.FieldContainer>
            )}
         </form.AppField>
         {/* Markdown preview for formatting style and list style */}
         <form.Subscribe
            selector={(state) => [
               state.values.formatting?.style,
               state.values.formatting?.listStyle,
            ]}
         >
            {([style, listStyle]) =>
               style ? (
                  <div className="mt-4">
                     <div className="text-xs font-semibold mb-1 text-muted-foreground">
                        {translate(
                           "pages.agent-creation-form.formatting.example-formatting",
                        )}
                     </div>
                     <Markdown
                        content={getFormattingExample(style, listStyle)}
                     />
                  </div>
               ) : null
            }
         </form.Subscribe>
      </div>
   );
}

export function FormattingStepSubscribe({
   form,
   next,
   isLastStep,
}: {
   form: AgentForm;
   next: () => void;
   isLastStep?: boolean;
}) {
   return (
      <form.AppField name="formatting.style">
         {(field) => {
            const value = field.state.value;
            const errors = field.state.meta.errors;
            const isValid = value && (!errors || errors.length === 0);
            return (
               <Button onClick={next} type="button" disabled={!isValid}>
                  {isLastStep
                     ? translate(
                          "pages.agent-creation-form.actions.create-agent",
                       )
                     : translate("pages.agent-creation-form.actions.next")}
               </Button>
            );
         }}
      </form.AppField>
   );
}
