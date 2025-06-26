// audience-style-step.tsx

import type {
  FormattingStyle,
  TargetAudience,
} from "@api/schemas/content-schema";
import {
  FORMATTING_STYLES,
  TARGET_AUDIENCES,
} from "../lib/agent-form-constants.js";
import { useAgentForm } from "../lib/use-agent-form.js";

export function AudienceStyleStep() {
  const { form } = useAgentForm();
  return (
    <>
      <form.AppField name="targetAudience">
        {(field) => (
          <field.FieldContainer id="target-audience-field">
            <field.FieldLabel className="text-sm font-medium text-foreground">
              Target Audience *
            </field.FieldLabel>
            <p className="text-sm text-muted-foreground mb-3">
              Who is your primary audience for this content?
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {TARGET_AUDIENCES.map((audience) => (
                <button
                  className={`group relative rounded-lg border-2 p-4 text-sm font-medium transition-all hover:shadow-sm ${
                    field.state.value === audience.value
                      ? "border-primary bg-primary/5 text-primary shadow-sm"
                      : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
                  }`}
                  key={audience.value}
                  onClick={() =>
                    field.handleChange(audience.value as TargetAudience)
                  }
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
        {(field) => (
          <field.FieldContainer id="formatting-style-field">
            <field.FieldLabel className="text-sm font-medium text-foreground">
              Formatting Style
            </field.FieldLabel>
            <p className="text-sm text-muted-foreground mb-3">
              How should your content be structured and presented?
            </p>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {FORMATTING_STYLES.map((style) => (
                <button
                  className={`group relative rounded-lg border-2 p-4 text-left text-sm font-medium transition-all hover:shadow-sm ${
                    field.state.value === style.value
                      ? "border-primary bg-primary/5 text-primary shadow-sm"
                      : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
                  }`}
                  key={style.value}
                  onClick={() =>
                    field.handleChange(style.value as FormattingStyle)
                  }
                  type="button"
                >
                  {style.label}
                  <div className="text-xs text-muted-foreground mt-1">
                    {style.value === "structured" &&
                      "Organized with clear headings and sections"}
                    {style.value === "casual" &&
                      "Conversational and free-flowing"}
                    {style.value === "technical" &&
                      "Detailed with specifications and data"}
                  </div>
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
