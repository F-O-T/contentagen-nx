import { Input } from "@packages/ui/components/input";
import type { AgentForm } from "../lib/use-agent-form";

export function AudienceStep({ form }: { form: AgentForm }) {
  return (
    <>
      {/* Audience Base (required) as buttons */}
      <form.AppField name="audienceBase">
        {(field) => {
          const options = [
            { value: "general_public", label: "General Public" },
            { value: "professionals", label: "Professionals" },
            { value: "beginners", label: "Beginners" },
            { value: "customers", label: "Customers" },
          ];
          return (
            <field.FieldContainer>
              <field.FieldLabel>Audience Type *</field.FieldLabel>
              <div className="flex gap-2 flex-wrap">
                {options.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`px-3 py-1 rounded border ${field.state.value === opt.value ? "bg-accent text-white" : "bg-white text-black"}`}
                    onClick={() => field.handleChange(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <field.FieldMessage />
            </field.FieldContainer>
          );
        }}
      </form.AppField>

      {/* Audience Personas as buttons */}
      <form.AppField name="audiencePersonas">
        {(field) => {
          // Example personas, can be customized or extended
          const personas = [
            "Marketer",
            "Developer",
            "Student",
            "Executive",
            "Entrepreneur",
            "Researcher",
            "Other",
          ];
          const valueArr = Array.isArray(field.state.value)
            ? field.state.value
            : [];
          const togglePersona = (persona: string) => {
            if (valueArr.includes(persona)) {
              field.handleChange(valueArr.filter((p) => p !== persona));
            } else {
              field.handleChange([...valueArr, persona]);
            }
          };
          return (
            <field.FieldContainer>
              <field.FieldLabel>Audience Personas</field.FieldLabel>
              <div className="flex gap-2 flex-wrap">
                {personas.map((persona) => (
                  <button
                    key={persona}
                    type="button"
                    className={`px-3 py-1 rounded border ${valueArr.includes(persona) ? "bg-accent text-white" : "bg-white text-black"}`}
                    onClick={() => togglePersona(persona)}
                  >
                    {persona}
                  </button>
                ))}
              </div>
              <field.FieldMessage />
            </field.FieldContainer>
          );
        }}
      </form.AppField>

      {/* Audience Regions (comma separated input) */}
      <form.AppField name="audienceRegions">
        {(field) => (
          <field.FieldContainer>
            <field.FieldLabel>Audience Regions</field.FieldLabel>
            <Input
              value={
                typeof field.state.value === "string"
                  ? field.state.value
                  : Array.isArray(field.state.value)
                    ? field.state.value.join(", ")
                    : ""
              }
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="e.g., US, Europe, Asia"
            />
            <field.FieldMessage />
          </field.FieldContainer>
        )}
      </form.AppField>
    </>
  );
}
