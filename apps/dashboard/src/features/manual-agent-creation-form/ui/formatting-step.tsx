import { Button } from "@packages/ui/components/button";
import { FormatConfigSchema } from "@packages/database/schemas/agent-types";
import type { AgentForm } from "../lib/use-agent-form";

// Helper function to convert schema values to display labels
const getFormatLabel = (value: string): string => {
  return value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
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
            <field.FieldLabel>Style *</field.FieldLabel>
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
            <field.FieldLabel>List Style (optional)</field.FieldLabel>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
              <button
                className={`group relative rounded-lg border-2 p-4 text-sm font-medium transition-all hover:shadow-sm ${
                  field.state.value === undefined
                    ? "border-primary bg-primary/5 text-primary shadow-sm"
                    : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
                }`}
                key="none"
                onClick={() => {
                  field.handleChange(undefined);
                  field.handleBlur();
                }}
                type="button"
              >
                None
              </button>
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
            {isLastStep ? "Create Agent" : "Next"}
          </Button>
        );
      }}
    </form.AppField>
  );
}
