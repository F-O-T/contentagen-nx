import { Button } from "@packages/ui/components/button";
import {
   Field,
   FieldDescription,
   FieldError,
   FieldGroup,
   FieldLabel,
} from "@packages/ui/components/field";
import { Input } from "@packages/ui/components/input";
import { Spinner } from "@packages/ui/components/spinner";
import { useForm } from "@tanstack/react-form";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Mail } from "lucide-react";
import { type FormEvent, useCallback, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { authClient } from "@/integrations/better-auth/auth-client";

export const Route = createFileRoute("/auth/magic-link")({
   component: MagicLinkPage,
});

function MagicLinkPage() {
   const [isSent, setIsSent] = useState(false);

   const schema = z.object({
      email: z.email("Insira um endereco de email valido."),
   });

   const handleMagicLinkSignIn = useCallback(async (email: string) => {
      await authClient.signIn.magicLink(
         {
            email,
            callbackURL: `${window.location.origin}/auth/callback`,
         },
         {
            onError: ({ error }) => {
               toast.error(error.message);
            },
            onRequest: () => {
               toast.loading("Enviando link de acesso...");
            },
            onSuccess: async () => {
               try {
                  const res = await fetch(
                     `/api/auth/dev/magic-link?email=${encodeURIComponent(email)}`,
                  );
                  const data = await res.json();
                  if (data.url) {
                     window.location.href = data.url;
                     return;
                  }
               } catch {
                  // Not in dev mode or endpoint unavailable — fall through
               }
               setIsSent(true);
               toast.success("Link enviado! Verifique seu e-mail.");
            },
         },
      );
   }, []);

   const form = useForm({
      defaultValues: {
         email: "",
      },
      onSubmit: async ({ value }) => {
         await handleMagicLinkSignIn(value.email);
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

   if (isSent) {
      return (
         <section className="space-y-6 w-full">
            <div className="text-center space-y-6 py-4">
               {/* Success Icon */}
               <div className="flex items-center justify-center">
                  <div className="flex items-center justify-center size-16 rounded-full bg-primary/10">
                     <Mail className="size-8 text-primary" />
                  </div>
               </div>

               {/* Header */}
               <div className="space-y-2">
                  <h1 className="text-3xl font-semibold font-serif">
                     Verifique seu e-mail
                  </h1>
                  <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                     Enviamos um link para seu e-mail. Clique nele para acessar
                     sua conta instantaneamente.
                  </p>
               </div>

               {/* Actions */}
               <div className="flex flex-col gap-3 pt-2">
                  <Button
                     className="h-11"
                     onClick={() => setIsSent(false)}
                     variant="outline"
                  >
                     Tentar outro e-mail
                  </Button>
                  <Button asChild variant="ghost">
                     <Link to="/auth/sign-in">
                        <ArrowLeft className="size-4" />
                        Voltar para o login
                     </Link>
                  </Button>
               </div>
            </div>
         </section>
      );
   }

   return (
      <section className="space-y-6 w-full">
         {/* Back Link */}
         <Button asChild className="gap-2 px-0" variant="link">
            <Link to="/auth/sign-in">
               <ArrowLeft className="size-4" />
               Voltar para o login
            </Link>
         </Button>

         {/* Header */}
         <div className="text-center space-y-2">
            <h1 className="text-3xl font-semibold font-serif">
               Acesso sem senha
            </h1>
            <p className="text-muted-foreground text-sm">
               Receba um link no seu e-mail para acessar sua conta sem precisar
               de senha.
            </p>
         </div>

         {/* Form */}
         <form className="space-y-4" onSubmit={handleSubmit}>
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
            <form.Subscribe>
               {(formState) => (
                  <Button
                     className="w-full h-11"
                     disabled={!formState.canSubmit || formState.isSubmitting}
                     type="submit"
                  >
                     {formState.isSubmitting ? <Spinner /> : "Enviar link"}
                  </Button>
               )}
            </form.Subscribe>
         </form>

         {/* Note */}
         <FieldDescription className="text-center">
            O link expira em 15 minutos. Verifique sua caixa de spam se nao
            encontrar o e-mail.
         </FieldDescription>

         {/* Footer */}
         <div className="text-sm text-center">
            <div className="flex gap-1 justify-center items-center">
               <span>Primeira vez aqui? </span>
               <Link
                  className="text-primary font-medium hover:underline"
                  to="/auth/sign-up"
               >
                  Criar conta
               </Link>
            </div>
         </div>
      </section>
   );
}
