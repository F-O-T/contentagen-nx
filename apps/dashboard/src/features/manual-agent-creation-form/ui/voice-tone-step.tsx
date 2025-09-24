import { Button } from "@packages/ui/components/button";
import { VoiceConfigSchema } from "@packages/database/schemas/agent";
import type { AgentForm } from "../lib/use-agent-form";
import { translate } from "@packages/localization";
import { Markdown } from "@packages/ui/components/markdown";
// Helper function to convert schema values to display labels
const getVoiceLabel = (value: string): string => {
   return value.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
};

// Example string generator for communication style
const getCommunicationExample = (style: string): string => {
   switch (style) {
      case "first_person":
         return `**${translate("pages.agent-creation-form.voice-tone.first-person-example")}**\n\n> ${translate("pages.agent-creation-form.voice-tone.first-person-text.line1")}\n> ${translate("pages.agent-creation-form.voice-tone.first-person-text.line2")}\n> ${translate("pages.agent-creation-form.voice-tone.first-person-text.line3")}`;
      case "third_person":
         return `**${translate("pages.agent-creation-form.voice-tone.third-person-example")}**\n\n> ${translate("pages.agent-creation-form.voice-tone.third-person-text.line1")}\n> ${translate("pages.agent-creation-form.voice-tone.third-person-text.line2")}\n> ${translate("pages.agent-creation-form.voice-tone.third-person-text.line3")}`;
      default:
         return translate(
            "pages.agent-creation-form.voice-tone.assistance-prompt",
         );
   }
};

export function VoiceToneStep({ form }: { form: AgentForm }) {
   // Extract the enum values from the schema
   const voiceOptions = VoiceConfigSchema.shape.communication.options;

   return (
      <form.AppField name="voice">
         {(field) => (
            <field.FieldContainer className="space-y-2">
               <field.FieldLabel>
                  {translate(
                     "pages.agent-creation-form.voice-tone.communication-style.label",
                  )}
               </field.FieldLabel>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                  {voiceOptions.map((option) => (
                     <button
                        className={`group relative rounded-lg border-2 p-4 text-sm font-medium transition-all hover:shadow-sm ${
                           field.state.value?.communication === option
                              ? "border-primary bg-primary/5 text-primary shadow-sm"
                              : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
                        }`}
                        key={option}
                        onClick={() => {
                           field.handleChange((prev) => ({
                              ...prev,
                              communication: option,
                           }));
                           field.handleBlur();
                        }}
                        type="button"
                     >
                        {getVoiceLabel(option)}
                     </button>
                  ))}
               </div>
               <field.FieldMessage />

               {/* Markdown preview for communication style */}
               {field.state.value?.communication && (
                  <div className="mt-4">
                     <div className="text-xs font-semibold mb-1 text-muted-foreground">
                        {translate(
                           "pages.agent-creation-form.voice-tone.example-communication",
                        )}
                     </div>
                     <Markdown
                        content={getCommunicationExample(
                           field.state.value.communication,
                        )}
                     />
                  </div>
               )}
            </field.FieldContainer>
         )}
      </form.AppField>
   );
}

export function VoiceToneStepSubscribe({
   form,
   next,
}: {
   form: AgentForm;
   next: () => void;
}) {
   return (
      <form.AppField name="voice">
         {(field) => {
            const value = field.state.value?.communication;
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
