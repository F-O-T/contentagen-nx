import { Input } from "@packages/ui/components/input";
import { TiptapEditor } from "@/widgets/tiptap-editor/tiptap-editor";
import type { AgentForm } from "../lib/use-agent-form";
import { Button } from "@packages/ui/components/button";

export function BasicInfoStep({ form }: { form: AgentForm }) {
  return (
    <>
      <form.AppField name="name">
        {(field) => (
          <field.FieldContainer>
            <field.FieldLabel>Agent Name *</field.FieldLabel>
            <Input
              autoComplete="off"
              id={field.name}
              name={field.name}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="e.g., Tech News Agent"
              value={field.state.value}
            />
            <field.FieldMessage />
          </field.FieldContainer>
        )}
      </form.AppField>
      <form.AppField name="description">
        {(field) => (
          <field.FieldContainer>
            <field.FieldLabel>Description *</field.FieldLabel>
            <TiptapEditor
              value={form.state.values.description || "<p></p>"}
              onChange={(val) => form.setFieldValue("description", val)}
              onBlur={field.handleBlur}
              name={field.name}
              id={field.name}
              placeholder="Describe what this agent does..."
              minHeight="200px"
            />
            <field.FieldMessage />
          </field.FieldContainer>
        )}
      </form.AppField>
    </>
  );
}

export function BasicInfoStepSubscribe({
  form,
  next,
}: {
  form: AgentForm;
  next: () => void;
}) {
  // Updated to require systemPrompt as well

  return (
    <form.Subscribe
      selector={(state) => ({
        nameValue: state.values.name,
        descriptionValue: state.values.description,
        fieldMeta: state.fieldMeta,
      })}
    >
      {({ nameValue, descriptionValue, fieldMeta }) => {
        const nameErrors = fieldMeta?.name?.errors;
        const descriptionErrors = fieldMeta?.description?.errors;

        const isNameValid =
          nameValue?.trim() !== "" &&
          (!nameErrors || nameErrors.length === 0);
        const isDescriptionValid =
          descriptionValue?.trim() !== "" &&
          (!descriptionErrors || descriptionErrors.length === 0);
        const canGoNext = isNameValid && isDescriptionValid;

        return (
          <Button onClick={next} type="button" disabled={!canGoNext}>
            Next
          </Button>
        );
      }}
    </form.Subscribe>
  );
}
