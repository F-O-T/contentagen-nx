import type {
   FormattingStyle,
   TargetAudience,
} from "@api/schemas/agent-schema";
import {
   FORMATTING_STYLES,
   TARGET_AUDIENCES,
} from "../lib/agent-form-constants";
import type { AgentForm } from "../lib/use-agent-form";
import { Button } from "@packages/ui/components/button";

export function TargetAudienceStep({ form }: { form: AgentForm }) {
   return (
      <form.AppField name="targetAudience">
         {(field) => (
            <field.FieldContainer id="target-audience-field">
               <div className="grid grid-cols-2 gap-4 sm:grid-cols-4  mx-auto">
                  {TARGET_AUDIENCES.map((audience) => (
                     <button
                        className={`group relative rounded-lg border-2 p-4 text-sm font-medium transition-all hover:shadow-sm ${
                           field.state.value === audience.value
                              ? "border-primary bg-primary/5 text-primary shadow-sm"
                              : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
                        }`}
                        key={audience.value}
                        onClick={() =>
                           field.handleChange(audience.value as TargetAudience)
                        }
                        type="button"
                     >
                        {audience.label}
                     </button>
                  ))}
               </div>
               <field.FieldMessage />
            </field.FieldContainer>
         )}
      </form.AppField>
   );
}

export function FormattingStyleStep({ form }: { form: AgentForm }) {
   return (
      <form.AppField name="formattingStyle">
         {(field) => (
            <field.FieldContainer id="formatting-style-field">
               <div className="grid grid-cols-1 gap-4 sm:grid-cols-3  mx-auto">
                  {FORMATTING_STYLES.map((style) => (
                     <button
                        className={`group relative rounded-lg border-2 p-4 text-left text-sm font-medium transition-all hover:shadow-sm ${
                           field.state.value === style.value
                              ? "border-primary bg-primary/5 text-primary shadow-sm"
                              : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
                        }`}
                        key={style.value}
                        onClick={() =>
                           field.handleChange(style.value as FormattingStyle)
                        }
                        type="button"
                     >
                        {style.label}
                        <div className="text-xs text-muted-foreground mt-1">
                           {style.value === "structured" &&
                              "Organized with clear headings and sections"}
                           {style.value === "narrative" &&
                              "Conversational and free-flowing"}
                           {style.value === "list_based" &&
                              "Detailed with specifications and data"}
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
export function TargetAudienceStepSubscribe({
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

export function FormattingStyleStepSubscribe({
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
