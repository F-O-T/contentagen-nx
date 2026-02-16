import {
   Field,
   FieldError,
   FieldGroup,
   FieldLabel,
} from "@packages/ui/components/field";
import { Input } from "@packages/ui/components/input";
import { useForm } from "@tanstack/react-form";
import {
   type FormEvent,
   forwardRef,
   useCallback,
   useEffect,
   useImperativeHandle,
   useState,
} from "react";
import { toast } from "sonner";
import { z } from "zod";
import { authClient } from "@/integrations/better-auth/auth-client";
import type { StepHandle, StepState } from "./step-handle";

const profileSchema = z.object({
   userName: z.string().min(2, "O nome deve ter no mínimo 2 caracteres."),
});

interface ProfileStepProps {
   defaultName: string;
   onNext: () => void;
   onStateChange: (state: StepState) => void;
}

export const ProfileStep = forwardRef<StepHandle, ProfileStepProps>(
   function ProfileStep({ defaultName, onNext, onStateChange }, ref) {
      const [isPending, setIsPending] = useState(false);

      const form = useForm({
         defaultValues: { userName: defaultName },
         onSubmit: async ({ value }) => {
            try {
               setIsPending(true);
               await authClient.updateUser({ name: value.userName });
               toast.success("Nome atualizado!");
               onNext();
            } catch (error) {
               toast.error(
                  error instanceof Error
                     ? error.message
                     : "Erro ao atualizar nome.",
               );
            } finally {
               setIsPending(false);
            }
         },
         validators: { onBlur: profileSchema },
      });

      useImperativeHandle(
         ref,
         () => ({
            submit: async () => {
               await form.handleSubmit();
               return true;
            },
            canContinue: true,
            isPending,
         }),
         [form, isPending],
      );

      useEffect(() => {
         onStateChange({ canContinue: true, isPending });
      }, [isPending, onStateChange]);

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
                  Como podemos te chamar?
               </h2>
               <p className="text-sm text-muted-foreground">
                  Usado para personalizar sua experiência.
               </p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
               <FieldGroup>
                  <form.Field name="userName">
                     {(field) => {
                        const isInvalid =
                           field.state.meta.isTouched &&
                           !field.state.meta.isValid;
                        return (
                           <Field data-invalid={isInvalid}>
                              <FieldLabel htmlFor={field.name}>
                                 Seu Nome
                              </FieldLabel>
                              <Input
                                 aria-invalid={isInvalid}
                                 autoComplete="name"
                                 autoFocus
                                 disabled={isPending}
                                 id={field.name}
                                 name={field.name}
                                 onBlur={field.handleBlur}
                                 onChange={(e) =>
                                    field.handleChange(e.target.value)
                                 }
                                 placeholder="Ex: João Silva"
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
            </form>
         </div>
      );
   },
);
