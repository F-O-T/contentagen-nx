import type { AgentForm } from "../lib/use-agent-form";
import { BRAND_INTEGRATIONS } from "../lib/agent-form-constants";
import { Button } from "@packages/ui/components/button";

export function BrandIntegrationStep({ form }: { form: AgentForm }) {
   return (
      <form.AppField name="brandIntegration">
         {(field) => (
            <field.FieldContainer id="brand-integration-field">
               <div className="grid grid-cols-1 gap-4 md:grid-cols-4 mx-auto">
                  {BRAND_INTEGRATIONS.map((option) => (
                     <button
                        className={`group relative rounded-lg border-2 p-4 text-left text-sm font-medium transition-all hover:shadow-sm ${
                           field.state.value === option.value
                              ? "border-primary bg-primary/5 text-primary shadow-sm"
                              : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
                        }`}
                        key={option.value}
                        onClick={() => field.handleChange(option.value)}
                        type="button"
                     >
                        {option.label}
                        <div className="text-xs text-muted-foreground mt-1">
                           {option.description}
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

export function BrandIntegrationStepSubscribe({
   form,
   next,
}: {
   form: AgentForm;
   next: () => void;
}) {
   return (
      <form.Subscribe>
         {() => (
            <Button type="button" onClick={next}>
               Next
            </Button>
         )}
      </form.Subscribe>
   );
}
