import type { AgentForm } from "../lib/use-agent-form";
import { Button } from "@packages/ui/components/button";

export function VoiceToneStep({ form }: { form: AgentForm }) {
   return (
      <>
         <form.AppField name="voice.communication">
            {(field) => (
               <field.FieldContainer>
                  <field.FieldLabel>Communication Style *</field.FieldLabel>
                  <div className="flex gap-4">
                     {["I", "we", "you"].map((option) => (
                        <label key={option} className="flex items-center gap-1">
                           <input
                              type="radio"
                              name={field.name}
                              value={option}
                              checked={field.state.value === option}
                              onChange={() =>
                                 field.handleChange(
                                    option as "I" | "we" | "you",
                                 )
                              }
                           />
                           {option}
                        </label>
                     ))}
                  </div>
                  <field.FieldMessage />
               </field.FieldContainer>
            )}
         </form.AppField>
         <form.AppField name="formatting.style">
            {(field) => (
               <field.FieldContainer>
                  <field.FieldLabel>Formatting Style</field.FieldLabel>
                  <select
                     name={field.name}
                     value={field.state.value ?? "structured"}
                     onChange={(e) => field.handleChange(e.target.value)}
                     className="w-full border rounded p-2"
                  >
                     {["structured", "narrative", "list_based"].map(
                        (option) => (
                           <option key={option} value={option}>
                              {option.charAt(0).toUpperCase() +
                                 option.slice(1).replace("_", " ")}
                           </option>
                        ),
                     )}
                  </select>
                  <field.FieldMessage />
               </field.FieldContainer>
            )}
         </form.AppField>
      </>
   );
}

export function VoiceToneStepSubscribe({
   form,
   next,
}: {
   form: AgentForm;
   next: () => void;
}) {
   return (
      <form.Subscribe selector={() => ({})}>
         {() => (
            <Button onClick={next} type="button">
               Next
            </Button>
         )}
      </form.Subscribe>
   );
}
