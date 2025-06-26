// content-config-step.tsx
import { useAgentForm } from "../lib/use-agent-form.js";
import {
  CONTENT_TYPES,
  VOICE_TONES,
  TARGET_AUDIENCES,
  FORMATTING_STYLES,
} from "../lib/agent-form-constants.js";

export function ContentConfigStep() {
  const { form } = useAgentForm();
  return (
    <>
      <form.AppField
        name="contentType"
        validators={{
          onChange: ({ value }: { value: string }) =>
            !value ? "Content type is required" : undefined,
        }}
      >
        {(field: any) => (
          <field.FieldContainer>
            <field.FieldLabel className="text-sm font-medium text-foreground">
              Content Type *
            </field.FieldLabel>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {CONTENT_TYPES.map((type) => (
                <button
                  className={`group relative rounded-lg border-2 p-4 text-sm font-medium transition-all hover:shadow-sm ${
                    field.state.value === type.value
                      ? "border-primary bg-primary/5 text-primary shadow-sm"
                      : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
                  }`}
                  key={type.value}
                  onClick={() => field.handleChange(type.value)}
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
      <form.AppField
        name="voiceTone"
        validators={{
          onChange: ({ value }: { value: string }) =>
            !value ? "Voice tone is required" : undefined,
        }}
      >
        {(field: any) => (
          <field.FieldContainer>
            <field.FieldLabel className="text-sm font-medium text-foreground">
              Voice Tone *
            </field.FieldLabel>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {VOICE_TONES.map((tone) => (
                <button
                  className={`group relative rounded-lg border-2 p-4 text-sm font-medium transition-all hover:shadow-sm ${
                    field.state.value === tone.value
                      ? "border-primary bg-primary/5 text-primary shadow-sm"
                      : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
                  }`}
                  key={tone.value}
                  onClick={() => field.handleChange(tone.value)}
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
      <form.AppField
        name="targetAudience"
        validators={{
          onChange: ({ value }: { value: string }) =>
            !value ? "Target audience is required" : undefined,
        }}
      >
        {(field: any) => (
          <field.FieldContainer>
            <field.FieldLabel className="text-sm font-medium text-foreground">
              Target Audience *
            </field.FieldLabel>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {TARGET_AUDIENCES.map((audience) => (
                <button
                  className={`group relative rounded-lg border-2 p-4 text-sm font-medium transition-all hover:shadow-sm ${
                    field.state.value === audience.value
                      ? "border-primary bg-primary/5 text-primary shadow-sm"
                      : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
                  }`}
                  key={audience.value}
                  onClick={() => field.handleChange(audience.value)}
                  type="button"
                >
                  {audience.label}
                </button>
              ))}
            </div>
            <field.FieldMessage />
          </field.FieldContainer>
        )}
      </form.AppField>
      <form.AppField name="formattingStyle">
        {(field: any) => (
          <field.FieldContainer>
            <field.FieldLabel className="text-sm font-medium text-foreground">
              Formatting Style
            </field.FieldLabel>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {FORMATTING_STYLES.map((style) => (
                <button
                  className={`group relative rounded-lg border-2 p-4 text-left text-sm font-medium transition-all hover:shadow-sm ${
                    field.state.value === style.value
                      ? "border-primary bg-primary/5 text-primary shadow-sm"
                      : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
                  }`}
                  key={style.value}
                  onClick={() => field.handleChange(style.value)}
                  type="button"
                >
                  {style.label}
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
