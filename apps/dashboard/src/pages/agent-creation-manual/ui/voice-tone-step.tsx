import type { VoiceTone } from "@api/schemas/content-schema";
import { VOICE_TONES } from "../lib/agent-form-constants";
import type { AgentForm } from "../lib/use-agent-form";

export default function VoiceToneStep({ form }: { form: AgentForm }) {
   return (
      <form.AppField name="voiceTone">
         {(field) => (
            <field.FieldContainer id="voice-tone-field">
               <div className="grid grid-cols-2 gap-4 sm:grid-cols-4  mx-auto">
                  {VOICE_TONES.map((tone) => (
                     <button
                        className={`group relative rounded-lg border-2 p-4 text-sm font-medium transition-all hover:shadow-sm ${
                           field.state.value === tone.value
                              ? "border-primary bg-primary/5 text-primary shadow-sm"
                              : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
                        }`}
                        key={tone.value}
                        onClick={() =>
                           field.handleChange(tone.value as VoiceTone)
                        }
                        type="button"
                     >
                        {tone.label}
                     </button>
                  ))}
               </div>
               <field.FieldMessage />
            </field.FieldContainer>
         )}
      </form.AppField>
   );
}
