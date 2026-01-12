import { Button } from "@packages/ui/components/button";
import {
   Field,
   FieldDescription,
   FieldError,
   FieldGroup,
   FieldLabel,
} from "@packages/ui/components/field";
import { Input } from "@packages/ui/components/input";
import { PasswordInput } from "@packages/ui/components/password-input";
import { defineStepper } from "@packages/ui/components/stepper";
import { useForm } from "@tanstack/react-form";
import { Link, useRouter } from "@tanstack/react-router";
import { type FormEvent, useCallback } from "react";
import { toast } from "sonner";
import z from "zod";
import { betterAuthClient } from "@/integrations/clients";

const steps = [
   { id: "basic-info", title: "basic-info" },
   { id: "password", title: "password" },
] as const;

const { Stepper } = defineStepper(...steps);

export function SignUpPage() {
   const router = useRouter();
   const schema = z
      .object({
         confirmPassword: z.string(),
         email: z.email("Insira um endereço de email válido."),
         name: z
            .string()
            .min(
               2,
               "O campo deve ter no mínimo {min} caracteres.".replace(
                  "{min}",
                  "2",
               ),
            ),
         password: z
            .string()
            .min(
               8,
               "O campo deve ter no mínimo {min} caracteres.".replace(
                  "{min}",
                  "8",
               ),
            ),
      })
      .refine((data) => data.password === data.confirmPassword, {
         message: "As senhas não coincidem.",
         path: ["confirmPassword"],
      });

   const handleSignUp = useCallback(
      async (email: string, name: string, password: string) => {
         await betterAuthClient.signUp.email(
            {
               email,
               name,
               password,
            },
            {
               onError: ({ error }) => {
                  toast.error(error.message);
               },
               onRequest: () => {
                  toast.loading("Criando sua conta...");
               },
               onSuccess: () => {
                  toast.success("Conta criada com sucesso!");
                  router.navigate({
                     search: { email },
                     to: "/auth/email-verification",
                  });
               },
            },
         );
      },
      [router.navigate],
   );

   const form = useForm({
      defaultValues: {
         confirmPassword: "",
         email: "",
         name: "",
         password: "",
      },
      onSubmit: async ({ value, formApi }) => {
         const { email, name, password } = value;
         await handleSignUp(email, name, password);
         formApi.reset();
      },
      validators: {
         onBlur: schema,
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

   function BasicInfoStep() {
      return (
         <>
            <FieldGroup>
               <form.Field name="name">
                  {(field) => {
                     const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
                     return (
                        <Field data-invalid={isInvalid}>
                           <FieldLabel htmlFor={field.name}>
                              {"Nome"}
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
                              placeholder={"Placeholder"}
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
               <form.Field name="email">
                  {(field) => {
                     const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
                     return (
                        <Field data-invalid={isInvalid}>
                           <FieldLabel htmlFor={field.name}>
                              {"Email"}
                           </FieldLabel>
                           <Input
                              aria-invalid={isInvalid}
                              autoComplete="email"
                              id={field.name}
                              name={field.name}
                              onBlur={field.handleBlur}
                              onChange={(e) =>
                                 field.handleChange(e.target.value)
                              }
                              placeholder={"Placeholder"}
                              type="email"
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
         </>
      );
   }

   // Internal component for password step
   function PasswordStep() {
      return (
         <>
            <FieldGroup>
               <form.Field name="password">
                  {(field) => {
                     const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
                     return (
                        <Field data-invalid={isInvalid}>
                           <FieldLabel htmlFor={field.name}>
                              {"Senha"}
                           </FieldLabel>
                           <PasswordInput
                              aria-invalid={isInvalid}
                              autoComplete="new-password"
                              id={field.name}
                              name={field.name}
                              onBlur={field.handleBlur}
                              onChange={(e) =>
                                 field.handleChange(e.target.value)
                              }
                              placeholder={"Placeholder"}
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
               <form.Field name="confirmPassword">
                  {(field) => {
                     const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
                     return (
                        <Field data-invalid={isInvalid}>
                           <FieldLabel htmlFor={field.name}>
                              {"Confirmar Senha"}
                           </FieldLabel>
                           <PasswordInput
                              aria-invalid={isInvalid}
                              autoComplete="new-password"
                              id={field.name}
                              name={field.name}
                              onBlur={field.handleBlur}
                              onChange={(e) =>
                                 field.handleChange(e.target.value)
                              }
                              placeholder={"Placeholder"}
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
         </>
      );
   }
   const TermsAndPrivacyText = () => {
      const text =
         "Ao continuar, você concorda com nossos {split} e {split}.".split(
            "{split}",
         );

      return (
         <>
            <span>{text[0]}</span>
            <a
               className="underline text-muted-foreground hover:text-primary"
               href="https://contentta.co/terms-of-service"
               rel="noopener noreferrer"
               target="_blank"
            >
               {"Termos de Serviço"}
            </a>
            <span>{text[1]}</span>
            <a
               className="underline text-muted-foreground hover:text-primary"
               href="https://contentta.co/privacy-policy"
               rel="noopener noreferrer"
               target="_blank"
            >
               {"Política de Privacidade"}
            </a>
            <span>{text[2]}</span>
         </>
      );
   };

   return (
      <Stepper.Provider>
         {({ methods }) => (
            <section className="space-y-6 w-full">
               {/* Header */}
               <div className="text-center space-y-2">
                  <h1 className="text-3xl font-semibold font-serif">
                     {"Cadastrar"}
                  </h1>
                  <p className="text-muted-foreground text-sm">
                     {"Crie sua conta para começar a usar o aplicativo."}
                  </p>
               </div>

               {/* Form */}
               <div className="space-y-6">
                  <Stepper.Navigation>
                     {steps.map((step) => (
                        <Stepper.Step key={step.id} of={step.id}></Stepper.Step>
                     ))}
                  </Stepper.Navigation>
                  <form className="space-y-4" onSubmit={handleSubmit}>
                     {methods.switch({
                        "basic-info": () => <BasicInfoStep />,
                        password: () => <PasswordStep />,
                     })}
                     <Stepper.Controls className="flex w-full justify-between">
                        <Button
                           className="h-11"
                           disabled={methods.isFirst}
                           onClick={methods.prev}
                           type="button"
                           variant="outline"
                        >
                           {"Voltar"}
                        </Button>
                        {methods.isLast ? (
                           <form.Subscribe>
                              {(formState) => (
                                 <Button
                                    className="h-11"
                                    disabled={
                                       !formState.canSubmit ||
                                       formState.isSubmitting
                                    }
                                    type="submit"
                                    variant="default"
                                 >
                                    {"Enviar"}
                                 </Button>
                              )}
                           </form.Subscribe>
                        ) : (
                           <form.Subscribe
                              selector={(state) => ({
                                 emailValid: state.fieldMeta.email?.isValid,
                                 nameValid: state.fieldMeta.name?.isValid,
                              })}
                           >
                              {({ nameValid, emailValid }) => (
                                 <Button
                                    className="h-11"
                                    disabled={!nameValid || !emailValid}
                                    onClick={methods.next}
                                    type="button"
                                 >
                                    {"Próximo"}
                                 </Button>
                              )}
                           </form.Subscribe>
                        )}
                     </Stepper.Controls>
                  </form>
               </div>

               {/* Footer */}
               <div className="text-sm text-center space-y-4">
                  <div className="flex gap-1 justify-center items-center">
                     <span>{"Já tem uma conta?"}</span>
                     <Link
                        className="text-primary font-medium hover:underline"
                        to="/auth/sign-in"
                     >
                        {"Entre aqui"}
                     </Link>
                  </div>
                  <FieldDescription className="text-center">
                     <TermsAndPrivacyText />
                  </FieldDescription>
               </div>
            </section>
         )}
      </Stepper.Provider>
   );
}
