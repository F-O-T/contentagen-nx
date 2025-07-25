import type { AgentForm } from "../lib/use-agent-form";
import { Button } from "@packages/ui/components/button";

export function VoiceToneStep({ form }: { form: AgentForm }) {
   return (
      <>
         <form.AppField name="formatting">
            {(field) => {
               // Example tone options
               const toneOptions = [
                  { value: "friendly", label: "Friendly" },
                  { value: "professional", label: "Professional" },
                  { value: "casual", label: "Casual" },
                  { value: "authoritative", label: "Authoritative" },
                  { value: "playful", label: "Playful" },
                  { value: "inspirational", label: "Inspirational" },
               ];
               // Get selected tones from form state
               const selectedTones = Array.isArray(field.state.value)
                  ? field.state.value
                  : [];
               // Helper to update a tone's weight
               const setToneWeight = (toneValue: string, weight: number) => {
                  const updated = selectedTones.map((t: any) =>
                     t.value === toneValue ? { ...t, weight } : t,
                  );
                  field.handleChange(updated);
               };
               // Helper to handle tone selection
               const handleToneSelect = (
                  e: React.ChangeEvent<HTMLSelectElement>,
               ) => {
                  const selected = Array.from(e.target.selectedOptions).map(
                     (o) => o.value,
                  );
                  // Keep existing weights if present, default to 1
                  const updated = selected.map((val) => {
                     const existing = selectedTones.find(
                        (t: any) => t.value === val,
                     );
                     return existing || { value: val, weight: 1 };
                  });
                  field.handleChange(updated);
               };
               return (
                  <field.FieldContainer>
                     <field.FieldLabel>Tone Mix *</field.FieldLabel>
                     <select
                        multiple
                        value={selectedTones.map((t: any) => t.value)}
                        onChange={handleToneSelect}
                        className="w-full border rounded p-2 mb-2"
                     >
                        {toneOptions.map((opt) => (
                           <option key={opt.value} value={opt.value}>
                              {opt.label}
                           </option>
                        ))}
                     </select>
                     {selectedTones.length > 0 && (
                        <div className="space-y-2">
                           {selectedTones.map((tone: any) => (
                              <div
                                 key={tone.value}
                                 className="flex items-center gap-2"
                              >
                                 <span className="w-32">
                                    {toneOptions.find(
                                       (o) => o.value === tone.value,
                                    )?.label || tone.value}
                                 </span>
                                 <input
                                    type="range"
                                    min={0}
                                    max={1}
                                    step={0.01}
                                    value={tone.weight}
                                    onChange={(e) =>
                                       setToneWeight(
                                          tone.value,
                                          parseFloat(e.target.value),
                                       )
                                    }
                                    className="flex-1"
                                 />
                                 <span className="w-10 text-right">
                                    {tone.weight}
                                 </span>
                              </div>
                           ))}
                        </div>
                     )}
                     <field.FieldMessage />
                  </field.FieldContainer>
               );
            }}
         </form.AppField>

         <form.AppField name="formatting.formality">
            {(field) => (
               <field.FieldContainer>
                  <field.FieldLabel>Formality</field.FieldLabel>
                  <input
                     type="range"
                     min={0}
                     max={1}
                     step={0.01}
                     value={field.state.value ?? 0.5}
                     onChange={(e) =>
                        field.handleChange(parseFloat(e.target.value))
                     }
                     className="w-full"
                  />
                  <span className="block text-right">
                     {field.state.value ?? 0.5}
                  </span>
                  <field.FieldMessage />
               </field.FieldContainer>
            )}
         </form.AppField>

         <form.AppField name="formatting.humorLevel">
            {(field) => (
               <field.FieldContainer>
                  <field.FieldLabel>Humor Level</field.FieldLabel>
                  <input
                     type="range"
                     min={0}
                     max={1}
                     step={0.01}
                     value={field.state.value ?? 0.5}
                     onChange={(e) =>
                        field.handleChange(parseFloat(e.target.value))
                     }
                     className="w-full"
                  />
                  <span className="block text-right">
                     {field.state.value ?? 0.5}
                  </span>
                  <field.FieldMessage />
               </field.FieldContainer>
            )}
         </form.AppField>

         <form.AppField name="formatting.emojiDensity">
            {(field) => (
               <field.FieldContainer>
                  <field.FieldLabel>Emoji Density</field.FieldLabel>
                  <input
                     type="range"
                     min={0}
                     max={1}
                     step={0.01}
                     value={field.state.value ?? 0.5}
                     onChange={(e) =>
                        field.handleChange(parseFloat(e.target.value))
                     }
                     className="w-full"
                  />
                  <span className="block text-right">
                     {field.state.value ?? 0.5}
                  </span>
                  <field.FieldMessage />
               </field.FieldContainer>
            )}
         </form.AppField>

         <form.AppField name="formatting.readingGrade">
            {(field) => (
               <field.FieldContainer>
                  <field.FieldLabel>Reading Grade</field.FieldLabel>
                  <input
                     type="range"
                     min={1}
                     max={12}
                     step={1}
                     value={field.state.value ?? 8}
                     onChange={(e) =>
                        field.handleChange(parseInt(e.target.value, 10))
                     }
                     className="w-full"
                  />
                  <span className="block text-right">
                     {field.state.value ?? 8}
                  </span>
                  <field.FieldMessage />
               </field.FieldContainer>
            )}
         </form.AppField>

         <form.AppField name="formatting.communication">
            {(field) => (
               <field.FieldContainer>
                  <field.FieldLabel>Communication Style</field.FieldLabel>
                  <div className="flex gap-4">
                     {["I", "we", "you"].map((option) => (
                        <label key={option} className="flex items-center gap-1">
                           <input
                              type="radio"
                              name={field.name}
                              value={option}
                              checked={field.state.value === option}
                              onChange={() => field.handleChange(option)}
                           />
                           {option}
                        </label>
                     ))}
                  </div>
                  <field.FieldMessage />
               </field.FieldContainer>
            )}
         </form.AppField>

         <form.AppField name="formatting.forbiddenWords">
            {(field) => (
               <field.FieldContainer>
                  <field.FieldLabel>
                     Forbidden Words (optional)
                  </field.FieldLabel>
                  <input
                     type="text"
                     value={
                        Array.isArray(field.state.value)
                           ? field.state.value.join(", ")
                           : ""
                     }
                     onChange={(e) =>
                        field.handleChange(
                           e.target.value
                              .split(/,|\n/)
                              .map((w) => w.trim())
                              .filter(Boolean),
                        )
                     }
                     placeholder="Enter words separated by commas or newlines"
                     className="w-full border rounded p-2"
                  />
                  <field.FieldMessage />
               </field.FieldContainer>
            )}
         </form.AppField>

         <form.AppField name="formatting.requiredHooks">
            {(field) => (
               <field.FieldContainer>
                  <field.FieldLabel>Required Hooks (optional)</field.FieldLabel>
                  <input
                     type="text"
                     value={
                        Array.isArray(field.state.value)
                           ? field.state.value.join(", ")
                           : ""
                     }
                     onChange={(e) =>
                        field.handleChange(
                           e.target.value
                              .split(/,|\n/)
                              .map((w) => w.trim())
                              .filter(Boolean),
                        )
                     }
                     placeholder="Enter hooks separated by commas or newlines"
                     className="w-full border rounded p-2"
                  />
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
      <form.Subscribe
         selector={(state) => ({
            fieldMeta: state.fieldMeta,
         })}
      >
         {({ fieldMeta }) => {
            const canGoNext = true;
            return (
               <Button onClick={next} type="button">
                  Next
               </Button>
            );
         }}
      </form.Subscribe>
   );
}
