import { Input } from "@packages/ui/components/input";
import { Textarea } from "@packages/ui/components/textarea";
import type { AgentForm } from "../lib/use-agent-form";
import { Button } from "@packages/ui/components/button";
import { languageEnum } from "@api/schemas/agent-schema";
import {
   Select,
   SelectTrigger,
   SelectContent,
   SelectItem,
} from "@packages/ui/components/select";

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
         <form.AppField name="language">
            {(field) => (
               <field.FieldContainer>
                  <field.FieldLabel>Language *</field.FieldLabel>
                  <Select
                     value={field.state.value || ""}
                     onValueChange={(value) =>
                        field.handleChange(
                           value as (typeof languageEnum.enumValues)[number],
                        )
                     }
                     name={field.name}
                  >
                     <SelectTrigger id={field.name} className="w-full">
                        {field.state.value
                           ? languageEnum.enumValues
                                .find((lang) => lang === field.state.value)
                                ?.charAt(0)
                                .toUpperCase() + field.state.value.slice(1)
                           : "Select a language"}
                     </SelectTrigger>
                     <SelectContent>
                        {languageEnum.enumValues.map((lang) => (
                           <SelectItem key={lang} value={lang}>
                              {lang.charAt(0).toUpperCase() + lang.slice(1)}
                           </SelectItem>
                        ))}
                     </SelectContent>
                  </Select>
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
export function BasicInfoStepSubscribe({
   form,
   next,
}: {
   form: AgentForm;
   next: () => void;
}) {
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
            const emailErrors = fieldMeta?.description?.errors;

            const isNameValid =
               nameValue?.trim() !== "" &&
               (!nameErrors || nameErrors.length === 0);
            const isEmailValid =
               descriptionValue?.trim() !== "" &&
               (!emailErrors || emailErrors.length === 0);
            const canGoNext = isNameValid && isEmailValid;

            return (
               <Button onClick={next} type="button" disabled={!canGoNext}>
                  Next
               </Button>
            );
         }}
      </form.Subscribe>
   );
}
