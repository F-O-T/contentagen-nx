import { Badge } from "@packages/ui/components/badge";
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { createErrorFallback } from "@packages/ui/components/error-fallback";
import {
   Item,
   ItemActions,
   ItemContent,
   ItemDescription,
   ItemGroup,
   ItemMedia,
   ItemTitle,
} from "@packages/ui/components/item";
import { Skeleton } from "@packages/ui/components/skeleton";
import { Switch } from "@packages/ui/components/switch";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Activity, Moon, Shield } from "lucide-react";
import { Suspense } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { authClient } from "@/integrations/better-auth/auth-client";
import { orpc } from "@/integrations/orpc/client";
import { ThemeSwitcher } from "@/layout/dashboard/theme-switcher";

export const Route = createFileRoute(
   "/_authenticated/$slug/_dashboard/settings/customization",
)({
   component: PreferencesPage,
});

function PreferencesSectionSkeleton() {
   return (
      <div className="space-y-4 md:space-y-6">
         <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Appearance Card Skeleton */}
            <div className="md:col-span-2 lg:col-span-2">
               <Card className="h-full">
                  <CardHeader>
                     <Skeleton className="h-6 w-1/3" />
                     <Skeleton className="h-4 w-2/3" />
                  </CardHeader>
                  <CardContent>
                     <div className="space-y-1">
                        <Skeleton className="h-16 w-full rounded-lg" />
                        <Skeleton className="h-16 w-full rounded-lg" />
                     </div>
                  </CardContent>
               </Card>
            </div>

            {/* Privacy Card Skeleton */}
            <Card className="h-full">
               <CardHeader>
                  <Skeleton className="h-6 w-2/3" />
                  <Skeleton className="h-4 w-full" />
               </CardHeader>
               <CardContent className="space-y-4">
                  <div className="rounded-lg bg-secondary/50 p-4 text-center">
                     <Skeleton className="h-4 w-1/2 mx-auto mb-2" />
                     <Skeleton className="h-6 w-24 mx-auto" />
                  </div>
                  <Skeleton className="h-16 w-full rounded-lg" />
               </CardContent>
            </Card>
         </div>
      </div>
   );
}

function PreferencesSectionErrorFallback(props: FallbackProps) {
   return (
      <Card className="h-full">
         <CardHeader>
            <CardTitle>Preferências</CardTitle>
            <CardDescription>
               Personalize sua experiência no aplicativo.
            </CardDescription>
         </CardHeader>
         <CardContent>
            {createErrorFallback({
               errorDescription: "Não foi possível carregar suas preferências",
               errorTitle: "Erro ao Carregar",
               retryText: "Tentar novamente",
            })(props)}
         </CardContent>
      </Card>
   );
}

// ============================================
// Content Creation Card Component (Pro only)
// ============================================

// ============================================
// Appearance Card Component
// ============================================

function AppearanceCard() {
   return (
      <Card className="h-full">
         <CardHeader>
            <CardTitle>Preferências</CardTitle>
            <CardDescription>
               Personalize a aparência da interface
            </CardDescription>
         </CardHeader>
         <CardContent>
            <ItemGroup>
               <Item variant="muted">
                  <ItemMedia variant="icon">
                     <Moon className="size-4" />
                  </ItemMedia>
                  <ItemContent className="min-w-0">
                     <ItemTitle>Tema</ItemTitle>
                     <ItemDescription className="line-clamp-2">
                        Escolha o tema da interface
                     </ItemDescription>
                  </ItemContent>
                  <ItemActions>
                     <ThemeSwitcher />
                  </ItemActions>
               </Item>
            </ItemGroup>
         </CardContent>
      </Card>
   );
}

// ============================================
// Privacy Card Component
// ============================================

function PrivacyCard({
   hasConsent,
   isPending,
   onConsentChange,
}: {
   hasConsent: boolean;
   isPending: boolean;
   onConsentChange: (consent: boolean) => void;
}) {
   return (
      <Card className="h-full">
         <CardHeader>
            <CardTitle>Privacidade</CardTitle>
            <CardDescription>
               Controle como seus dados são utilizados
            </CardDescription>
         </CardHeader>
         <CardContent className="space-y-4">
            <div className="rounded-lg bg-secondary/50 p-4 text-center">
               <p className="text-xs md:text-sm text-muted-foreground mb-1">
                  Status da Telemetria
               </p>
               <div className="flex items-center justify-center gap-2">
                  {hasConsent ? (
                     <>
                        <Shield className="size-5 text-green-500" />
                        <span className="text-lg font-semibold text-green-500">
                           Ativada
                        </span>
                     </>
                  ) : (
                     <>
                        <Shield className="size-5 text-muted-foreground" />
                        <span className="text-lg font-semibold text-muted-foreground">
                           Desativada
                        </span>
                     </>
                  )}
               </div>
               <Badge className="mt-2" variant="secondary">
                  {hasConsent ? "Compartilhando Dados" : "Dados Privados"}
               </Badge>
            </div>

            <ItemGroup>
               <Item variant="muted">
                  <ItemMedia variant="icon">
                     <Activity className="size-4" />
                  </ItemMedia>
                  <ItemContent className="min-w-0">
                     <ItemTitle>Telemetria</ItemTitle>
                     <ItemDescription className="line-clamp-2">
                        Ajude-nos a melhorar compartilhando dados de uso
                        anônimos
                     </ItemDescription>
                  </ItemContent>
                  <ItemActions>
                     <Switch
                        aria-label="Telemetria"
                        checked={hasConsent}
                        disabled={isPending}
                        onCheckedChange={onConsentChange}
                     />
                  </ItemActions>
               </Item>
            </ItemGroup>
         </CardContent>
      </Card>
   );
}

// ============================================
// Main Content Component
// ============================================

function PreferencesSectionContent() {
   const { data: session } = useSuspenseQuery(
      orpc.session.getSession.queryOptions({}),
   );

   const updateConsentMutation = useMutation({
      mutationFn: async (consent: boolean) => {
         return authClient.updateUser({
            telemetryConsent: consent,
         });
      },
   });

   const hasConsent = session?.user?.telemetryConsent ?? true;

   return (
      <div className="space-y-4 md:space-y-6">
         <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="md:col-span-2 lg:col-span-2">
               <AppearanceCard />
            </div>
            <PrivacyCard
               hasConsent={hasConsent}
               isPending={updateConsentMutation.isPending}
               onConsentChange={(checked) => {
                  updateConsentMutation.mutate(checked);
               }}
            />
         </div>
      </div>
   );
}

function PreferencesPage() {
   return (
      <ErrorBoundary FallbackComponent={PreferencesSectionErrorFallback}>
         <Suspense fallback={<PreferencesSectionSkeleton />}>
            <PreferencesSectionContent />
         </Suspense>
      </ErrorBoundary>
   );
}
