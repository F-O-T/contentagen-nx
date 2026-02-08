import { Button } from "@packages/ui/components/button";
import {
   Field,
   FieldError,
   FieldGroup,
   FieldLabel,
} from "@packages/ui/components/field";
import { Input } from "@packages/ui/components/input";
import { Spinner } from "@packages/ui/components/spinner";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { type FormEvent, useCallback } from "react";
import { toast } from "sonner";
import z from "zod";
import { orpc } from "@/integrations/orpc/client";

const profileSchema = z.object({
   userName: z.string().min(2, "O nome deve ter no minimo 2 caracteres."),
   workspaceName: z
      .string()
      .min(2, "O nome do workspace deve ter no minimo 2 caracteres."),
});

interface ProfileSetupStepProps {
   onNext: (newSlug: string) => void;
}

export function ProfileSetupStep({ onNext }: ProfileSetupStepProps) {
   const { data: session } = useQuery(orpc.session.getSession.queryOptions({}));
   const { data: org } = useQuery(
      orpc.organization.getActiveOrganization.queryOptions({}),
   );

   const mutation = useMutation(
      orpc.onboarding.completeProfileSetup.mutationOptions({
         onSuccess: (data) => {
            toast.success("Perfil atualizado com sucesso!");
            onNext(data.slug);
         },
         onError: (error) => {
            toast.error(error.message ?? "Erro ao atualizar perfil.");
         },
      }),
   );

   const form = useForm({
      defaultValues: {
         userName: session?.user?.name ?? "",
         workspaceName: org?.name ?? "",
      },
      onSubmit: async ({ value }) => {
         await mutation.mutateAsync(value);
      },
      validators: {
         onBlur: profileSchema,
      },
   });

   const handleSubmit = useCallback(
      (e: FormEvent) => {
         e.preventDefault();
         e.stopPropagation();
         form.handleSubmit();
      },
      [form],
   );

   return (
      <div className="space-y-6">
         <div className="space-y-2 text-center">
            <h2 className="font-serif text-2xl font-semibold">
               Configure seu perfil
            </h2>
            <p className="text-sm text-muted-foreground">
               Confirme seu nome e o nome do seu workspace.
            </p>
         </div>

         <form className="space-y-4" onSubmit={handleSubmit}>
            <FieldGroup>
               <form.Field name="userName">
                  {(field) => {
                     const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
                     return (
                        <Field data-invalid={isInvalid}>
                           <FieldLabel htmlFor={field.name}>
                              Seu nome
                           </FieldLabel>
                           <Input
                              aria-invalid={isInvalid}
                              autoComplete="name"
                              id={field.name}
                              name={field.name}
                              onBlur={field.handleBlur}
                              onChange={(e) =>
                                 field.handleChange(e.target.value)
                              }
                              placeholder="Seu nome completo"
                              value={field.state.value}
                           />
                           {isInvalid && (
                              <FieldError errors={field.state.meta.errors} />
                           )}
                        </Field>
                     );
                  }}
               </form.Field>
            </FieldGroup>

            <FieldGroup>
               <form.Field name="workspaceName">
                  {(field) => {
                     const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
                     return (
                        <Field data-invalid={isInvalid}>
                           <FieldLabel htmlFor={field.name}>
                              Nome do workspace
                           </FieldLabel>
                           <Input
                              aria-invalid={isInvalid}
                              id={field.name}
                              name={field.name}
                              onBlur={field.handleBlur}
                              onChange={(e) =>
                                 field.handleChange(e.target.value)
                              }
                              placeholder="Minha empresa"
                              value={field.state.value}
                           />
                           {isInvalid && (
                              <FieldError errors={field.state.meta.errors} />
                           )}
                        </Field>
                     );
                  }}
               </form.Field>
            </FieldGroup>

            <form.Subscribe>
               {(formState) => (
                  <Button
                     className="h-11 w-full"
                     disabled={!formState.canSubmit || formState.isSubmitting}
                     type="submit"
                  >
                     {formState.isSubmitting ? (
                        <Spinner className="size-4" />
                     ) : (
                        "Continuar"
                     )}
                  </Button>
               )}
            </form.Subscribe>
         </form>
      </div>
   );
}
