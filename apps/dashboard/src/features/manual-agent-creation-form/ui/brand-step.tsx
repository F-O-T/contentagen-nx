import { Button } from "@packages/ui/components/button";
import { TiptapEditor } from "@packages/ui/components/tiptap-editor";
import { BrandConfigSchema } from "@packages/database/schemas/agent-types";
import { trpc } from "@/integrations/clients";
import type { AgentForm } from "../lib/use-agent-form";

// Helper function to convert schema values to display labels
const getBrandLabel = (value: string): string => {
  return value.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
};

export function BrandStep({ form }: { form: AgentForm }) {
  // Extract the enum values from the schema
  const integrationStyleOptions =
    BrandConfigSchema.shape.integrationStyle.options;

  // Get agentId from form state (assume it's in metadata or similar)
  const agentId = form.state.values.metadata?.id || "";
  const { data, isLoading, error } = trpc.agentFile.listBrandFiles.useQuery(
    agentId ? { agentId } : undefined,
  );

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold">Available Brand Files</h3>
        {isLoading && <div>Loading brand files…</div>}
        {error && <div className="text-red-500">Error loading files</div>}
        {data && data.files.length === 0 && <div>No brand files found.</div>}
        {data && data.files.length > 0 && (
          <ul className="list-disc pl-5">
            {data.files.map((file) => (
              <li key={file}>{file}</li>
            ))}
          </ul>
        )}
      </div>{" "}
      <form.AppField name="brand.integrationStyle">
        {(field) => (
          <field.FieldContainer className="space-y-2">
            <field.FieldLabel>Integration Style *</field.FieldLabel>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              {integrationStyleOptions.map((option) => (
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
                  {getBrandLabel(option)}
                </button>
              ))}
            </div>
            <field.FieldMessage />
          </field.FieldContainer>
        )}
      </form.AppField>
      <form.AppField name="brand.blacklistWords">
        {(field) => (
          <field.FieldContainer className="space-y-2">
            <field.FieldLabel>Blacklist Words (optional)</field.FieldLabel>
            <TiptapEditor
              value={form.state.values.brand?.blacklistWords || "<p></p>"}
              onChange={(val) =>
                form.setFieldValue("brand.blacklistWords", val)
              }
              onBlur={field.handleBlur}
              name={field.name}
              id={field.name}
              placeholder="Enter words to avoid..."
              className="w-full"
              error={
                field.state.meta.isTouched && field.state.meta.errors.length > 0
              }
            />
            <field.FieldMessage />
          </field.FieldContainer>
        )}
      </form.AppField>
    </div>
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
    <form.AppField name="brand.integrationStyle">
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
