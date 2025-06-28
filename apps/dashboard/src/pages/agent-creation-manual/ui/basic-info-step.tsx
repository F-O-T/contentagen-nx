import { Input } from "@packages/ui/components/input";
import { Textarea } from "@packages/ui/components/textarea";
import type { AgentForm } from "../lib/use-agent-form";

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
                  <Textarea
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
