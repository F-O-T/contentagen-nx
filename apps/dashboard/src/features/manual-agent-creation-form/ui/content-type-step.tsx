import type { ContentType } from "@api/schemas/agent-schema";
import { CONTENT_TYPES } from "../lib/agent-form-constants.js";
import type { AgentForm } from "../lib/use-agent-form.js";
import { Button } from "@packages/ui/components/button";

export function ContentTypeStep({ form }: { form: AgentForm }) {
   return (
      <form.AppField name="contentType">
         {(field) => (
            <field.FieldContainer id="content-type-field">
               <div className="grid grid-cols-2 gap-4 sm:grid-cols-4  mx-auto">
                  {CONTENT_TYPES.map((type) => (
                     <button
                        className={`group relative rounded-lg border-2 p-4 text-sm font-medium transition-all hover:shadow-sm ${
                           field.state.value === type.value
                              ? "border-primary bg-primary/5 text-primary shadow-sm"
                              : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
                        }`}
                        key={type.value}
                        onClick={() =>
                           field.handleChange(type.value as ContentType)
                        }
                        type="button"
                     >
                        {type.label}
                     </button>
                  ))}
               </div>
               <field.FieldMessage />
            </field.FieldContainer>
         )}
      </form.AppField>
   );
}
export function ContentTypeStepSubscribe({
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
