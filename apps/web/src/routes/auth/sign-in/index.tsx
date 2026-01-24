import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import { FieldDescription } from "@packages/ui/components/field";
import { Spinner } from "@packages/ui/components/spinner";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { KeyRound, Sparkles, User } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
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

function SignInPage() {
  const { redirect: redirectUrl } = Route.useSearch();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [lastMethod, setLastMethod] = useState<string | null>(null);

  useEffect(() => {
    setLastMethod(authClient.getLastUsedLoginMethod());
  }, []);

  const handleGoogleSignIn = useCallback(async () => {
    // Calculate callbackURL here - only runs on client interaction
    const callbackURL = redirectUrl
      ? `${window.location.origin}${redirectUrl}`
      : `${window.location.origin}/auth/callback`;

    await authClient.signIn.social(
      {
        callbackURL,
        provider: "google",
      },
      {
        onError: ({ error }) => {
          setIsGoogleLoading(false);
          toast.error(error.message);
        },
        onRequest: () => {
          setIsGoogleLoading(true);
          toast.loading("Conectando com Google...");
        },
      },
    );
  }, [redirectUrl]);

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

      {/* Primary Actions */}
      <div className="space-y-3">
        {/* Google SSO - Primary */}
        <Button
          className="w-full h-12 text-base relative"
          disabled={isGoogleLoading}
          onClick={handleGoogleSignIn}
          variant="outline"
        >
          {isGoogleLoading ? (
            <Spinner />
          ) : (
            <svg
              className="size-5"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <title>Google</title>
              <path
                d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                fill="currentColor"
              />
            </svg>
          )}
          <span>Continuar com Google</span>
          {lastMethod === "google" && (
            <Badge className="absolute -top-2 -right-2" variant="default">
              Ultimo usado
            </Badge>
          )}
        </Button>

        {/* Try without account - Prominent */}
        <Button
          asChild
          className="w-full h-12 text-base relative"
          variant="secondary"
        >
          <Link to="/auth/anonymous">
            <User className="size-5" />
            <span>Experimentar sem conta</span>
            {lastMethod === "anonymous" && (
              <Badge
                className="absolute -top-2 -right-2"
                variant="default"
              >
                Ultimo usado
              </Badge>
            )}
          </Link>
        </Button>
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            ou continue com
          </span>
        </div>
      </div>

      {/* Method Selector Cards */}
      <div className="grid grid-cols-2 gap-3">
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

        {/* Magic Link Card */}
        <Link
          className="group relative flex flex-col items-center gap-3 p-4 rounded-lg border border-border bg-background hover:border-primary hover:bg-accent/50 transition-all duration-200"
          to="/auth/magic-link"
        >
          {lastMethod === "magicLink" && (
            <Badge className="absolute -top-2 -right-2" variant="default">
              Ultimo usado
            </Badge>
          )}
          <div className="flex items-center justify-center size-10 rounded-full bg-muted group-hover:bg-primary/10 transition-colors">
            <Sparkles className="size-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">Link Magico</p>
            <p className="text-xs text-muted-foreground">
              Receba um link de acesso no seu e-mail
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
