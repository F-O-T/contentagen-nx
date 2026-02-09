import { Badge } from "@packages/ui/components/badge";
import { FieldDescription } from "@packages/ui/components/field";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { KeyRound, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { authClient } from "@/integrations/better-auth/auth-client";
import { orpc } from "@/integrations/orpc/client";

const signInSearchSchema = z.object({
   redirect: z.string().optional(),
});

export const Route = createFileRoute("/auth/sign-in/")({
   validateSearch: signInSearchSchema,
   beforeLoad: async ({ search, context }) => {
      const session = await context.queryClient
         .fetchQuery(orpc.session.getSession.queryOptions())
         .catch(() => null);
      if (session) {
         // If there's a redirect URL, use it; otherwise go to auth callback
         if (search.redirect) {
            throw redirect({ to: search.redirect });
         }
         throw redirect({ to: "/auth/callback" });
      }
   },
   component: SignInPage,
});

export function SignInPage() {
   const [lastMethod, setLastMethod] = useState<string | null>(null);

   useEffect(() => {
      setLastMethod(authClient.getLastUsedLoginMethod());
   }, []);

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
      <section className="space-y-8 w-full">
         {/* Header */}
         <div className="text-center space-y-2">
            <h1 className="text-3xl font-semibold font-serif">Entrar</h1>
            <p className="text-muted-foreground text-sm">
               Bom te ver de novo! Entre na sua conta para continuar.
            </p>
         </div>

         {/* Method Selector Cards */}
         <div className="flex flex-col gap-3">
            {/* Magic Link Card */}
            <Link
               className="group relative flex flex-col items-center gap-4 p-6 rounded-xl border border-primary/70 bg-primary/5 hover:border-primary hover:bg-primary/10 transition-all duration-200"
               to="/auth/magic-link"
            >
               {lastMethod === "magicLink" && (
                  <Badge className="absolute -top-2 -right-2" variant="default">
                     Ultimo usado
                  </Badge>
               )}
               <div className="flex items-center justify-center size-12 rounded-full bg-primary/10 group-hover:bg-primary/15 transition-colors">
                  <Sparkles className="size-6 text-primary transition-colors" />
               </div>
               <div className="text-center">
                  <p className="text-base font-semibold">Link Magico</p>
                  <p className="text-sm text-muted-foreground">
                     Receba um link de acesso no seu e-mail
                  </p>
               </div>
            </Link>

            {/* Email & Password Card */}
            <Link
               className="group relative flex flex-col items-center gap-3 p-4 rounded-lg border border-border bg-background hover:border-primary hover:bg-accent/50 transition-all duration-200"
               to="/auth/sign-in/email"
            >
               {lastMethod === "email" && (
                  <Badge className="absolute -top-2 -right-2" variant="default">
                     Ultimo usado
                  </Badge>
               )}
               <div className="flex items-center justify-center size-10 rounded-full bg-muted group-hover:bg-primary/10 transition-colors">
                  <KeyRound className="size-5 text-muted-foreground group-hover:text-primary transition-colors" />
               </div>
               <div className="text-center">
                  <p className="text-sm font-medium">Email e Senha</p>
                  <p className="text-xs text-muted-foreground">
                     Faca login com seu e-mail e senha
                  </p>
               </div>
            </Link>
         </div>

         {/* Footer */}
         <div className="text-sm text-center space-y-4">
            <div className="flex gap-1 justify-center items-center">
               <span>Primeira vez aqui? </span>
               <Link
                  className="text-primary font-medium hover:underline"
                  to="/auth/sign-up"
               >
                  Criar conta
               </Link>
            </div>
            <FieldDescription className="text-center">
               <TermsAndPrivacyText />
            </FieldDescription>
         </div>
      </section>
   );
}
