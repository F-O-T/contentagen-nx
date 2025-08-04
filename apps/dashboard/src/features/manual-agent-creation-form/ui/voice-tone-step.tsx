import { Button } from "@packages/ui/components/button";
import { VoiceConfigSchema } from "@packages/database/schemas/agent";
import type { AgentForm } from "../lib/use-agent-form";

// Helper function to convert schema values to display labels
const getVoiceLabel = (value: string): string => {
   return value.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
};

export function VoiceToneStep({ form }: { form: AgentForm }) {
   // Extract the enum values from the schema
   const voiceOptions = VoiceConfigSchema.shape.communication.options;

   return (
      <form.AppField name="voice">
         {(field) => (
            <field.FieldContainer className="space-y-2">
               <field.FieldLabel>Communication Style *</field.FieldLabel>
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
                  Next
               </Button>
            );
         }}
      </form.AppField>
   );
}
