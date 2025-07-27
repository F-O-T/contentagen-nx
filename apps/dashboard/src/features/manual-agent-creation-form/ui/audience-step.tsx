import { Button } from "@packages/ui/components/button";

import { AudienceConfigSchema } from "@packages/database/schemas/agent-types";
import type { AgentForm } from "../lib/use-agent-form";

// Helper function to convert schema values to display labels
const getAudienceLabel = (value: string): string => {
  return value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export function AudienceStep({ form }: { form: AgentForm }) {
  // Extract the enum values from the schema
  const audienceOptions = AudienceConfigSchema.shape.base.options;

  return (
    <form.AppField name="audience">
      {(field) => (
        <field.FieldContainer className="space-y-2">
          <field.FieldLabel>Audience Base *</field.FieldLabel>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full">
            {audienceOptions.map((option) => (
              <button
                className={`group relative rounded-lg border-2 p-4 text-sm font-medium transition-all hover:shadow-sm ${
                  field.state.value?.base === option
                    ? "border-primary bg-primary/5 text-primary shadow-sm"
                    : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
                }`}
                key={option}
                onClick={() => {
                  field.handleChange((prev) => ({
                    ...prev,
                    base: option,
                  }));
                  field.handleBlur();
                }}
                type="button"
              >
                {getAudienceLabel(option)}
              </button>
            ))}
          </div>
          <field.FieldMessage />
        </field.FieldContainer>
      )}
    </form.AppField>
  );
}

export function AudienceStepSubscribe({
  form,
  next,
}: {
  form: AgentForm;
  next: () => void;
}) {
  return (
    <form.AppField name="audience">
      {(field) => {
        const value = field.state.value?.base;
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
