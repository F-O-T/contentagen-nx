import { Button } from "@packages/ui/components/button";
import { FieldDescription } from "@packages/ui/components/field";
import { Spinner } from "@packages/ui/components/spinner";
import { Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Check, Sparkles, Zap } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { betterAuthClient } from "@/integrations/clients";

export function AnonymousPage() {
   const router = useRouter();
   const [isLoading, setIsLoading] = useState(false);

   const handleAnonymousSignIn = useCallback(async () => {
      setIsLoading(true);
      await betterAuthClient.signIn.anonymous(
         {},
         {
            onError: ({ error }) => {
               setIsLoading(false);
               toast.error(error.message);
            },
            onSuccess: () => {
               toast.success("Pronto! Sua conta foi criada.");
               router.navigate({ params: { slug: "" }, to: "/$slug/home" });
            },
         },
      );
   }, [router]);

   return (
      <section className="space-y-6 w-full">
         {/* Back Link */}
         <Button asChild className="gap-2 px-0" variant="link">
            <Link to="/auth/sign-in">
               <ArrowLeft className="size-4" />
               {"Voltar para o login"}
            </Link>
         </Button>

         {/* Header */}
         <div className="text-center space-y-2">
            <h1 className="text-3xl font-semibold font-serif">
               {"Acesso rápido"}
            </h1>
            <p className="text-muted-foreground text-sm">
               {
                  "Experimente o Montte agora mesmo. Você pode criar uma conta completa depois."
               }
            </p>
         </div>

         {/* Benefits */}
         <div className="space-y-6">
            <div className="rounded-lg border border-border bg-muted/30 p-5 space-y-4">
               <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center size-6 rounded-full bg-primary/10 shrink-0">
                     <Check className="size-3.5 text-primary" />
                  </div>
                  <p className="text-sm">{"Sem precisar de e-mail ou senha"}</p>
               </div>
               <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center size-6 rounded-full bg-primary/10 shrink-0">
                     <Zap className="size-3.5 text-primary" />
                  </div>
                  <p className="text-sm">{"Acesso imediato, sem cadastro"}</p>
               </div>
               <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center size-6 rounded-full bg-primary/10 shrink-0">
                     <Sparkles className="size-3.5 text-primary" />
                  </div>
                  <p className="text-sm">{"Convert Later"}</p>
               </div>
            </div>

            {/* CTA Button */}
            <Button
               className="w-full h-11"
               disabled={isLoading}
               onClick={handleAnonymousSignIn}
            >
               {isLoading ? <Spinner /> : "Começar agora"}
            </Button>

            {/* Note */}
            <FieldDescription className="text-center">
               {
                  "Seus dados ficam salvos. Você pode adicionar um e-mail a qualquer momento nas configurações."
               }
            </FieldDescription>
         </div>

         {/* Footer */}
         <div className="text-sm text-center">
            <div className="flex gap-1 justify-center items-center">
               <span>{"Primeira vez aqui? "}</span>
               <Link
                  className="text-primary font-medium hover:underline"
                  to="/auth/sign-up"
               >
                  {"Criar conta"}
               </Link>
            </div>
         </div>
      </section>
   );
}
