// basic-info-step.tsx
import { Input } from "@packages/ui/components/input";
import { Textarea } from "@packages/ui/components/textarea";
import { useAgentForm } from "../lib/use-agent-form.js";

export function BasicInfoStep() {
  const { form } = useAgentForm();
  return (
    <>
      <form.AppField name="name">
        {(field: any) => (
          <field.FieldContainer>
            <field.FieldLabel>Agent Name</field.FieldLabel>
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
      <form.AppField name="projectId">
        {(field: any) => (
          <field.FieldContainer>
            <field.FieldLabel>Project ID</field.FieldLabel>
            <Input
              autoComplete="off"
              id={field.name}
              name={field.name}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="e.g., Tech Blog"
              value={field.state.value}
            />
            <field.FieldMessage />
          </field.FieldContainer>
        )}
      </form.AppField>
      <form.AppField name="description">
        {(field: any) => (
          <field.FieldContainer>
            <field.FieldLabel>Description</field.FieldLabel>
            <Textarea
              autoComplete="off"
              id={field.name}
              name={field.name}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="Describe what this agent will do..."
              rows={3}
              value={field.state.value}
            />
            <field.FieldMessage />
          </field.FieldContainer>
        )}
      </form.AppField>
    </>
  );
}
