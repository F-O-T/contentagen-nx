// content-type-step.tsx

import type { ContentType, VoiceTone } from "@api/schemas/content-schema";
import { CONTENT_TYPES, VOICE_TONES } from "../lib/agent-form-constants.js";
import { useAgentForm } from "../lib/use-agent-form.js";

export function ContentTypeStep() {
  const { form } = useAgentForm();
  return (
    <>
      <form.AppField name="contentType">
        {(field) => (
          <field.FieldContainer id="content-type-field">
            <field.FieldLabel className="text-sm font-medium text-foreground">
              Content Type *
            </field.FieldLabel>
            <p className="text-sm text-muted-foreground mb-3">
              What type of content will your agent create?
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {CONTENT_TYPES.map((type) => (
                <button
                  className={`group relative rounded-lg border-2 p-4 text-sm font-medium transition-all hover:shadow-sm ${
                    field.state.value === type.value
                      ? "border-primary bg-primary/5 text-primary shadow-sm"
                      : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
                  }`}
                  key={type.value}
                  onClick={() => field.handleChange(type.value as ContentType)}
                  type="button"
                >
                  {type.label}
                </button>
              ))}
            </div>
            <field.FieldMessage />
          </field.FieldContainer>
        )}
      </form.AppField>

      <form.AppField name="voiceTone">
        {(field) => (
          <field.FieldContainer id="voice-tone-field">
            <field.FieldLabel className="text-sm font-medium text-foreground">
              Voice Tone *
            </field.FieldLabel>
            <p className="text-sm text-muted-foreground mb-3">
              How should your agent communicate with your audience?
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {VOICE_TONES.map((tone) => (
                <button
                  className={`group relative rounded-lg border-2 p-4 text-sm font-medium transition-all hover:shadow-sm ${
                    field.state.value === tone.value
                      ? "border-primary bg-primary/5 text-primary shadow-sm"
                      : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
                  }`}
                  key={tone.value}
                  onClick={() => field.handleChange(tone.value as VoiceTone)}
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
    </>
  );
}
