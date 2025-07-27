import {
  ToggleGroup,
  ToggleGroupItem,
} from "@packages/ui/components/toggle-group";
import { TiptapEditor } from "@/widgets/tiptap-editor/tiptap-editor";
import type { AgentForm } from "../lib/use-agent-form";
import { Button } from "@packages/ui/components/button";

export function BrandStep({ form }: { form: AgentForm }) {
  return (
    <>
      <form.AppField name="brand.integrationStyle">
        {(field) => (
          <field.FieldContainer>
            <field.FieldLabel>Brand Integration Style *</field.FieldLabel>
            <ToggleGroup
              type="single"
              value={field.state.value}
              onValueChange={(val) => field.handleChange(val)}
              className="grid grid-cols-1 md:grid-cols-4 gap-2 w-full"
            >
              <ToggleGroupItem value="strict_guideline" className="flex-1 p-0">
                <Button
                  type="button"
                  variant={
                    field.state.value === "strict_guideline"
                      ? "default"
                      : "outline"
                  }
                  className={`w-full rounded-none first:rounded-l-md last:rounded-r-md ${field.state.value !== "strict_guideline" ? "bg-muted" : ""}`}
                >
                  Strict Guideline
                </Button>
              </ToggleGroupItem>
              <ToggleGroupItem
                value="flexible_guideline"
                className="flex-1 p-0"
              >
                <Button
                  type="button"
                  variant={
                    field.state.value === "flexible_guideline"
                      ? "default"
                      : "outline"
                  }
                  className={`w-full rounded-none first:rounded-l-md last:rounded-r-md ${field.state.value !== "flexible_guideline" ? "bg-muted" : ""}`}
                >
                  Flexible Guideline
                </Button>
              </ToggleGroupItem>
              <ToggleGroupItem value="reference_only" className="flex-1 p-0">
                <Button
                  type="button"
                  variant={
                    field.state.value === "reference_only"
                      ? "default"
                      : "outline"
                  }
                  className={`w-full rounded-none first:rounded-l-md last:rounded-r-md ${field.state.value !== "reference_only" ? "bg-muted" : ""}`}
                >
                  Reference Only
                </Button>
              </ToggleGroupItem>
              <ToggleGroupItem value="creative_blend" className="flex-1 p-0">
                <Button
                  type="button"
                  variant={
                    field.state.value === "creative_blend"
                      ? "default"
                      : "outline"
                  }
                  className={`w-full rounded-none first:rounded-l-md last:rounded-r-md ${field.state.value !== "creative_blend" ? "bg-muted" : ""}`}
                >
                  Creative Blend
                </Button>
              </ToggleGroupItem>
            </ToggleGroup>{" "}
            <field.FieldMessage />
          </field.FieldContainer>
        )}
      </form.AppField>

      <form.AppField name="brand.blacklistWords">
        {(field) => (
          <field.FieldContainer>
            <field.FieldLabel>Blacklist Words</field.FieldLabel>
            <TiptapEditor
              value={
                typeof field.state.value === "string"
                  ? field.state.value
                  : "<p></p>"
              }
              onChange={(val) => field.handleChange(val)}
              onBlur={field.handleBlur}
              name={field.name}
              id={field.name}
              placeholder="Enter words/phrases to avoid (one per line or comma separated)"
              minHeight="120px"
            />
            <field.FieldMessage />
          </field.FieldContainer>
        )}
      </form.AppField>
    </>
  );
}

export function BrandStepSubscribe({
  form,
  next,
}: {
  form: AgentForm;
  next: () => void;
}) {
  return (
    <form.Subscribe
      selector={(state) => ({
        style: state.values.brand?.integrationStyle,
        fieldMeta: state.fieldMeta,
      })}
    >
      {({ style, fieldMeta }) => {
        const styleErrors =
          fieldMeta?.brand && "integrationStyle" in fieldMeta.brand
            ? fieldMeta.brand.integrationStyle.errors
            : undefined;
        const isStyleValid =
          style && (!styleErrors || styleErrors.length === 0);
        const canGoNext = isStyleValid;
        return (
          <Button onClick={next} type="button" disabled={!canGoNext}>
            Next
          </Button>
        );
      }}
    </form.Subscribe>
  );
}
