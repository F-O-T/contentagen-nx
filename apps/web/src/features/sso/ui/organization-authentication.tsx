import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { Skeleton } from "@packages/ui/components/skeleton";
import { Switch } from "@packages/ui/components/switch";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Globe, Plus, Shield } from "lucide-react";
import { Suspense } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { orpc } from "@/integrations/orpc/client";

function OrganizationAuthenticationSkeleton() {
   return (
      <div className="space-y-6">
         <div>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96 mt-1" />
         </div>
         <div className="grid gap-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
         </div>
      </div>
   );
}

function OrganizationAuthenticationErrorFallback({
   resetErrorBoundary,
}: FallbackProps) {
   return (
      <div className="space-y-6">
         <div>
            <h1 className="text-2xl font-semibold font-serif">
               Autenticação e SSO
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
               Configure autenticação empresarial e SSO.
            </p>
         </div>
         <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-muted-foreground mb-4">
               Não foi possível carregar as configurações de autenticação
            </p>
            <Button onClick={resetErrorBoundary} variant="outline">
               Tentar novamente
            </Button>
         </div>
      </div>
   );
}

function OrganizationAuthenticationContent() {
   const { data: domains } = useSuspenseQuery(
      orpc.sso.getDomains.queryOptions({}),
   );

   const { data: configurations } = useSuspenseQuery(
      orpc.sso.getConfigurations.queryOptions({}),
   );

   return (
      <div className="space-y-6">
         <div>
            <h1 className="text-2xl font-semibold font-serif">
               Autenticação e SSO
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
               Configure autenticação empresarial e SSO para sua organização.
            </p>
         </div>

         <div className="grid gap-6">
            <Card>
               <CardHeader>
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2">
                        <Globe className="size-5 text-muted-foreground" />
                        <div>
                           <CardTitle>Domínios Verificados</CardTitle>
                           <CardDescription>
                              Gerencie os domínios autorizados para acesso SSO
                           </CardDescription>
                        </div>
                     </div>
                     <Button size="sm" variant="outline">
                        <Plus className="size-4 mr-2" />
                        Adicionar domínio
                     </Button>
                  </div>
               </CardHeader>
               <CardContent>
                  {domains.length === 0 ? (
                     <div className="flex flex-col items-center justify-center py-8 text-center">
                        <Globe className="size-8 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                           Nenhum domínio configurado
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                           Adicione domínios verificados para permitir SSO
                        </p>
                     </div>
                  ) : (
                     <div className="space-y-3">
                        {domains.map((domain) => (
                           <div
                              className="flex items-center justify-between p-3 border rounded-lg"
                              key={domain.id}
                           >
                              <div className="flex items-center gap-3">
                                 <div>
                                    <div className="flex items-center gap-2">
                                       <span className="text-sm font-medium">
                                          {domain.domain}
                                       </span>
                                       {domain.verified ? (
                                          <Badge
                                             className="text-xs"
                                             variant="default"
                                          >
                                             Verificado
                                          </Badge>
                                       ) : (
                                          <Badge
                                             className="text-xs"
                                             variant="secondary"
                                          >
                                             Pendente
                                          </Badge>
                                       )}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                       Adicionado em{" "}
                                       {new Date(
                                          domain.createdAt,
                                       ).toLocaleDateString("pt-BR")}
                                    </p>
                                 </div>
                              </div>
                              {domain.verified && (
                                 <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">
                                       Auto-join
                                    </span>
                                    <Switch checked={domain.autoJoinEnabled} />
                                 </div>
                              )}
                           </div>
                        ))}
                     </div>
                  )}
               </CardContent>
            </Card>

            <Card>
               <CardHeader>
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2">
                        <Shield className="size-5 text-muted-foreground" />
                        <div>
                           <CardTitle>Provedores SSO</CardTitle>
                           <CardDescription>
                              Configure SAML 2.0, OIDC e outros provedores
                           </CardDescription>
                        </div>
                     </div>
                     <Button size="sm" variant="outline">
                        <Plus className="size-4 mr-2" />
                        Configurar SSO
                     </Button>
                  </div>
               </CardHeader>
               <CardContent>
                  {configurations.length === 0 ? (
                     <div className="flex flex-col items-center justify-center py-8 text-center">
                        <Shield className="size-8 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                           Nenhum provedor configurado
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                           Configure SAML, OIDC ou outros provedores SSO
                        </p>
                     </div>
                  ) : (
                     <div className="space-y-3">
                        {configurations.map((config) => (
                           <div
                              className="flex items-center justify-between p-3 border rounded-lg"
                              key={config.id}
                           >
                              <div>
                                 <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium capitalize">
                                       {config.provider}
                                    </span>
                                    {config.enabled ? (
                                       <Badge
                                          className="text-xs"
                                          variant="default"
                                       >
                                          Ativo
                                       </Badge>
                                    ) : (
                                       <Badge
                                          className="text-xs"
                                          variant="secondary"
                                       >
                                          Inativo
                                       </Badge>
                                    )}
                                 </div>
                                 <p className="text-xs text-muted-foreground mt-0.5">
                                    Configurado em{" "}
                                    {new Date(
                                       config.createdAt,
                                    ).toLocaleDateString("pt-BR")}
                                 </p>
                              </div>
                              <Switch checked={config.enabled} />
                           </div>
                        ))}
                     </div>
                  )}
               </CardContent>
            </Card>
         </div>
      </div>
   );
}

export function OrganizationAuthentication() {
   return (
      <ErrorBoundary
         FallbackComponent={OrganizationAuthenticationErrorFallback}
      >
         <Suspense fallback={<OrganizationAuthenticationSkeleton />}>
            <OrganizationAuthenticationContent />
         </Suspense>
      </ErrorBoundary>
   );
}
