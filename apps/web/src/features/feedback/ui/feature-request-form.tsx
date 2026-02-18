import { Button } from "@packages/ui/components/button";
import {
   CredenzaBody,
   CredenzaDescription,
   CredenzaHeader,
   CredenzaTitle,
} from "@packages/ui/components/credenza";
import {
   Field,
   FieldError,
   FieldGroup,
   FieldLabel,
} from "@packages/ui/components/field";
import { Textarea } from "@packages/ui/components/textarea";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle, Loader2, Star } from "lucide-react";
import { type FormEvent, useCallback } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { orpc } from "@/integrations/orpc/client";

type FeatureRequestFormProps = {
   defaultValues?: {
      feature?: string;
      problem?: string;
      priority?: number;
   };
   onSuccess: () => void;
};

export function FeatureRequestForm({
   defaultValues,
   onSuccess,
}: FeatureRequestFormProps) {
   const featureRequestSchema = z.object({
      feature: z.string().min(1, "Descreva a funcionalidade desejada."),
      problem: z.string(),
      priority: z.number(),
   });

   const mutation = useMutation(
      orpc.feedback.submitFeatureRequest.mutationOptions({
         onSuccess: () => {
            toast.success("Obrigado pela sugestão! Será avaliada pela equipe.");
            setTimeout(onSuccess, 1500);
         },
         onError: (error) => {
            toast.error(error.message ?? "Erro ao enviar sugestão.");
         },
      }),
   );

   const form = useForm({
      defaultValues: {
         feature: defaultValues?.feature ?? "",
         problem: defaultValues?.problem ?? "",
         priority: defaultValues?.priority ?? 0,
      },
      onSubmit: async ({ value }) => {
         await mutation.mutateAsync({
            feature: value.feature,
            problem: value.problem || undefined,
            priority: value.priority,
         });
      },
      validators: { onBlur: featureRequestSchema },
   });

   const handleSubmit = useCallback(
      (e: FormEvent) => {
         e.preventDefault();
         e.stopPropagation();
         form.handleSubmit();
      },
      [form],
   );

   if (mutation.isSuccess) {
      return (
         <CredenzaBody>
            <div className="flex flex-col items-center gap-3 py-8 text-center">
               <CheckCircle className="size-10 text-green-500" />
               <p className="text-sm font-medium">Obrigado pela sugestão!</p>
               <p className="text-xs text-muted-foreground">
                  Sua ideia foi registrada e será avaliada pela equipe.
               </p>
            </div>
         </CredenzaBody>
      );
   }

   return (
      <>
         <CredenzaHeader>
            <CredenzaTitle>Sugerir Feature</CredenzaTitle>
            <CredenzaDescription>
               Compartilhe suas ideias para novas funcionalidades.
            </CredenzaDescription>
         </CredenzaHeader>
         <CredenzaBody>
            <form className="space-y-4" onSubmit={handleSubmit}>
               <FieldGroup>
                  <form.Field name="feature">
                     {(field) => {
                        const isInvalid =
                           field.state.meta.isTouched &&
                           !field.state.meta.isValid;
                        return (
                           <Field data-invalid={isInvalid}>
                              <FieldLabel htmlFor={field.name}>
                                 Que feature você gostaria?
                              </FieldLabel>
                              <Textarea
                                 aria-invalid={isInvalid}
                                 id={field.name}
                                 name={field.name}
                                 onBlur={field.handleBlur}
                                 onChange={(e) =>
                                    field.handleChange(e.target.value)
                                 }
                                 placeholder="Descreva a funcionalidade que você precisa..."
                                 rows={3}
                                 value={field.state.value}
                              />
                              {isInvalid && (
                                 <FieldError errors={field.state.meta.errors} />
                              )}
                           </Field>
                        );
                     }}
                  </form.Field>

                  <form.Field name="problem">
                     {(field) => (
                        <Field>
                           <FieldLabel htmlFor={field.name}>
                              Qual problema ela resolveria?
                           </FieldLabel>
                           <Textarea
                              id={field.name}
                              name={field.name}
                              onBlur={field.handleBlur}
                              onChange={(e) =>
                                 field.handleChange(e.target.value)
                              }
                              placeholder="Nos ajude a entender o contexto..."
                              rows={2}
                              value={field.state.value}
                           />
                        </Field>
                     )}
                  </form.Field>

                  <form.Field name="priority">
                     {(field) => (
                        <Field>
                           <FieldLabel>Qual a prioridade para você?</FieldLabel>
                           <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((value) => (
                                 <button
                                    className="rounded-md p-1.5 transition-colors hover:bg-muted"
                                    key={`priority-${value}`}
                                    onClick={() => field.handleChange(value)}
                                    type="button"
                                 >
                                    <Star
                                       className={`size-6 ${
                                          value <= field.state.value
                                             ? "fill-amber-400 text-amber-400"
                                             : "text-muted-foreground"
                                       }`}
                                    />
                                 </button>
                              ))}
                           </div>
                           <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Seria legal</span>
                              <span>Preciso muito</span>
                           </div>
                        </Field>
                     )}
                  </form.Field>
               </FieldGroup>

               <form.Subscribe>
                  {(canSubmit) => (
                     <Button
                        className="w-full"
                        disabled={!canSubmit || mutation.isPending}
                        type="submit"
                     >
                        {mutation.isPending && (
                           <Loader2 className="mr-2 size-4 animate-spin" />
                        )}
                        Enviar sugestão
                     </Button>
                  )}
               </form.Subscribe>
            </form>
         </CredenzaBody>
      </>
   );
}
