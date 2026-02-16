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
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { type FormEvent, useCallback } from "react";
import { toast } from "sonner";
import z from "zod";
import { authClient } from "@/integrations/better-auth/auth-client";

const steps = [
   { id: "basic-info", title: "basic-info" },
   { id: "password", title: "password" },
] as const;

const { Stepper } = defineStepper(...steps);

export const Route = createFileRoute("/auth/sign-up")({
   component: SignUpPage,
});

function SignUpPage() {
   const router = useRouter();
   const schema = z
      .object({
         confirmPassword: z.string(),
         email: z.email("Insira um endereco de email valido."),
         name: z.string().min(2, "O campo deve ter no minimo 2 caracteres."),
         password: z
            .string()
            .min(8, "O campo deve ter no minimo 8 caracteres."),
      })
      .refine((data) => data.password === data.confirmPassword, {
         message: "As senhas nao coincidem.",
         path: ["confirmPassword"],
      });

   const handleSignUp = useCallback(
      async (email: string, name: string, password: string) => {
         await authClient.signUp.email(
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
                           <FieldLabel htmlFor={field.name}>Nome</FieldLabel>
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
               <form.Field name="email">
                  {(field) => {
                     const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
                     return (
                        <Field data-invalid={isInvalid}>
                           <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                           <Input
                              aria-invalid={isInvalid}
                              autoComplete="email"
                              id={field.name}
                              name={field.name}
                              onBlur={field.handleBlur}
                              onChange={(e) =>
                                 field.handleChange(e.target.value)
                              }
                              placeholder="seu@email.com"
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
                           <FieldLabel htmlFor={field.name}>Senha</FieldLabel>
                           <PasswordInput
                              aria-invalid={isInvalid}
                              autoComplete="new-password"
                              id={field.name}
                              name={field.name}
                              onBlur={field.handleBlur}
                              onChange={(e) =>
                                 field.handleChange(e.target.value)
                              }
                              placeholder="Minimo 8 caracteres"
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
                              Confirmar Senha
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
                              placeholder="Repita a senha"
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
         "Ao continuar, voce concorda com nossos {split} e {split}.".split(
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
               Termos de Servico
            </a>
            <span>{text[1]}</span>
            <a
               className="underline text-muted-foreground hover:text-primary"
               href="https://contentta.co/privacy-policy"
               rel="noopener noreferrer"
               target="_blank"
            >
               Politica de Privacidade
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
                     Cadastrar
                  </h1>
                  <p className="text-muted-foreground text-sm">
                     Crie sua conta para comecar a usar o aplicativo.
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
                     {methods.flow.switch({
                        "basic-info": () => <BasicInfoStep />,
                        password: () => <PasswordStep />,
                     })}
                     <Stepper.Controls className="flex w-full justify-between">
                        <Button
                           className="h-11"
                           disabled={methods.state.isFirst}
                           onClick={() => methods.navigation.prev()}
                           type="button"
                           variant="outline"
                        >
                           Voltar
                        </Button>
                        {methods.state.isLast ? (
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
                                    Enviar
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
                                    onClick={() => methods.navigation.next()}
                                    type="button"
                                 >
                                    Proximo
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
                     <span>Ja tem uma conta?</span>
                     <Link
                        className="text-primary font-medium hover:underline"
                        to="/auth/sign-in"
                     >
                        Entre aqui
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
