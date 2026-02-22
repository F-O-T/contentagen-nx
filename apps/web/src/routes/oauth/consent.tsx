import { Button } from "@packages/ui/components/button";
import {
   Card,
   CardContent,
   CardDescription,
   CardFooter,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { Separator } from "@packages/ui/components/separator";
import { createFileRoute } from "@tanstack/react-router";
import { Shield, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { authClient } from "@/integrations/better-auth/auth-client";

const consentSearchSchema = z.object({
   client_id: z.string(),
   scope: z.string().optional(),
});

export const Route = createFileRoute("/oauth/consent")({
   validateSearch: consentSearchSchema,
   component: ConsentPage,
});

const SCOPE_LABELS: Record<string, string> = {
   openid: "Identificacao basica",
   profile: "Informacoes do perfil",
   email: "Endereco de email",
   offline_access: "Acesso offline",
   "content:read": "Ler conteudos",
   "content:write": "Criar e editar conteudos",
   "content:publish": "Publicar conteudos",
   "writer:read": "Ver escritores IA",
};

type ClientInfo = {
   name?: string | null;
   uri?: string | null;
   icon?: string | null;
};

function ConsentPage() {
   const { client_id, scope } = Route.useSearch();

   const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null);
   const [isLoadPending, startLoadTransition] = useTransition();
   const [isSubmitPending, startSubmitTransition] = useTransition();
   const [error, setError] = useState<string | null>(null);

   const scopes = scope ? scope.split(" ").filter(Boolean) : [];

   useEffect(() => {
      startLoadTransition(async () => {
         try {
            const response = await authClient.oauth2.publicClient({
               query: { client_id },
            });

            if (response.error) {
               setError("Nao foi possivel encontrar o aplicativo solicitante.");
               return;
            }

            setClientInfo({
               name: response.data?.client_name ?? null,
               uri: response.data?.client_uri ?? null,
               icon: response.data?.logo_uri ?? null,
            });
         } catch {
            setError("Erro ao carregar informacoes do aplicativo.");
         }
      });
   }, [client_id]);

   const handleConsent = useCallback(
      (accept: boolean) => {
         startSubmitTransition(async () => {
            const response = await authClient.oauth2.consent({
               accept,
               scope,
            });

            if (response.error) {
               toast.error("Erro ao processar sua resposta. Tente novamente.");
               return;
            }

            if (response.data?.redirect && response.data?.uri) {
               window.location.href = response.data.uri;
            }
         });
      },
      [scope, startSubmitTransition],
   );

   if (isLoadPending || (!clientInfo && !error)) {
      return (
         <div className="flex min-h-screen items-center justify-center bg-background px-4">
            <Card className="w-full max-w-md">
               <CardHeader className="text-center">
                  <div className="flex justify-center mb-2">
                     <div className="size-12 rounded-full bg-muted animate-pulse" />
                  </div>
                  <div className="h-6 w-48 mx-auto bg-muted animate-pulse rounded" />
                  <div className="h-4 w-64 mx-auto bg-muted animate-pulse rounded mt-2" />
               </CardHeader>
               <CardContent>
                  <div className="space-y-3">
                     {Array.from({ length: 3 }).map((_, i) => (
                        <div
                           className="h-5 bg-muted animate-pulse rounded"
                           key={`skeleton-${i + 1}`}
                        />
                     ))}
                  </div>
               </CardContent>
            </Card>
         </div>
      );
   }

   if (error) {
      return (
         <div className="flex min-h-screen items-center justify-center bg-background px-4">
            <Card className="w-full max-w-md">
               <CardHeader className="text-center">
                  <div className="flex justify-center mb-2">
                     <Shield className="size-12 text-destructive" />
                  </div>
                  <CardTitle className="text-xl">Erro</CardTitle>
                  <CardDescription>{error}</CardDescription>
               </CardHeader>
               <CardFooter className="justify-center">
                  <Button
                     onClick={() => window.history.back()}
                     variant="outline"
                  >
                     Voltar
                  </Button>
               </CardFooter>
            </Card>
         </div>
      );
   }

   const appName = clientInfo?.name || "Aplicativo desconhecido";

   return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
         <Card className="w-full max-w-md">
            <CardHeader className="text-center">
               <div className="flex justify-center mb-2">
                  {clientInfo?.icon ? (
                     <img
                        alt={appName}
                        className="size-12 rounded-full"
                        src={clientInfo.icon}
                     />
                  ) : (
                     <div className="flex items-center justify-center size-12 rounded-full bg-primary/10">
                        <ShieldCheck className="size-6 text-primary" />
                     </div>
                  )}
               </div>
               <CardTitle className="text-xl">Autorizar acesso</CardTitle>
               <CardDescription>
                  <span className="font-medium text-foreground">{appName}</span>{" "}
                  deseja acessar sua conta Contentta.
               </CardDescription>
            </CardHeader>

            {scopes.length > 0 && (
               <CardContent>
                  <Separator className="mb-4" />
                  <p className="text-sm text-muted-foreground mb-3">
                     Este aplicativo tera acesso a:
                  </p>
                  <ul className="space-y-2">
                     {scopes.map((s) => (
                        <li className="flex items-center gap-2 text-sm" key={s}>
                           <div className="size-1.5 rounded-full bg-primary shrink-0" />
                           <span>{SCOPE_LABELS[s] ?? s}</span>
                        </li>
                     ))}
                  </ul>
                  <Separator className="mt-4" />
               </CardContent>
            )}

            <CardFooter className="flex gap-3">
               <Button
                  className="flex-1"
                  disabled={isSubmitPending}
                  onClick={() => handleConsent(false)}
                  variant="outline"
               >
                  Negar
               </Button>
               <Button
                  className="flex-1"
                  disabled={isSubmitPending}
                  onClick={() => handleConsent(true)}
               >
                  Permitir
               </Button>
            </CardFooter>
         </Card>
      </div>
   );
}
