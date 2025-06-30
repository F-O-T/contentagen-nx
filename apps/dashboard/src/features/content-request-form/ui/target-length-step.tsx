import type { ContentLength } from "@api/schemas/content-schema";
import type { ContentRequestForm } from "../lib/use-content-request-form";
import { Button } from "@packages/ui/components/button";

const CONTENT_LENGTHS = [
   {
      value: "short" as const,
      label: "Short",
      description: "Quick and concise content (500-800 words)",
   },
   {
      value: "medium" as const,
      label: "Medium", 
      description: "Balanced content with good detail (800-1500 words)",
   },
   {
      value: "long" as const,
      label: "Long",
      description: "Comprehensive and in-depth content (1500+ words)",
   },
];

export function TargetLengthStep({ form }: { form: ContentRequestForm }) {
   return (
      <form.AppField name="targetLength">
         {(field) => (
            <field.FieldContainer id="target-length-field">
               <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mx-auto">
                  {CONTENT_LENGTHS.map((length) => (
                     <button
                        className={`group relative rounded-lg border-2 p-4 text-left text-sm font-medium transition-all hover:shadow-sm ${
                           field.state.value === length.value
                              ? "border-primary bg-primary/5 text-primary shadow-sm"
                              : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
                        }`}
                        key={length.value}
                        onClick={() =>
                           field.handleChange(length.value as ContentLength)
                        }
                        type="button"
                     >
                        <div className="font-semibold">{length.label}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                           {length.description}
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

export function TargetLengthStepSubscribe({
   form,
   next,
}: {
   form: ContentRequestForm;
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
