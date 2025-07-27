import { Button } from "@packages/ui/components/button";
import { PurposeChannelSchema } from "@packages/database/schemas/agent-types";
import type { AgentForm } from "../lib/use-agent-form";

// Helper function to convert schema values to display labels
const getChannelLabel = (value: string): string => {
  return value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export function PurposeStep({ form }: { form: AgentForm }) {
  // Extract the enum values from the schema
  const channelOptions = PurposeChannelSchema.options;

  return (
    <form.AppField name="purpose">
      {(field) => (
        <field.FieldContainer className="space-y-2">
          <field.FieldLabel>Primary Channel *</field.FieldLabel>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
            {channelOptions.map((option) => (
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
                {getChannelLabel(option)}
              </button>
            ))}
          </div>
          <field.FieldMessage />
        </field.FieldContainer>
      )}
    </form.AppField>
  );
}

export function PurposeStepSubscribe({
  form,
  next,
}: {
  form: AgentForm;
  next: () => void;
}) {
  return (
    <form.AppField name="purpose">
      {(field) => {
        const value = field.state.value;
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
