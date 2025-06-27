import type {
  FormattingStyle,
  TargetAudience,
} from "@api/schemas/content-schema";
import {
  FORMATTING_STYLES,
  TARGET_AUDIENCES,
} from "../lib/agent-form-constants.js";
import { useAgentForm } from "../lib/use-agent-form";

export function TargetAudienceStep({form}:{form:AgentForm}) {
  
  return (
    <form.AppField name="targetAudience">
      {(field) => (
        <field.FieldContainer id="target-audience-field">
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 max-w-sm mx-auto">
            {TARGET_AUDIENCES.map((audience) => (
              <button
                className={`group relative rounded-lg border-2 p-4 text-sm font-medium transition-all hover:shadow-sm ${field.state.value === audience.value
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
  );
}

export function FormattingStyleStep({form}:{form:AgentForm}) {

  return (
    <form.AppField name="formattingStyle">
      {(field) => (
        <field.FieldContainer id="formatting-style-field">
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3 max-w-sm mx-auto">
            {FORMATTING_STYLES.map((style) => (
              <button
                className={`group relative rounded-lg border-2 p-4 text-left text-sm font-medium transition-all hover:shadow-sm ${field.state.value === style.value
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
  );
}
