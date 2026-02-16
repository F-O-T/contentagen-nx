import { Card, CardContent } from "@packages/ui/components/card";
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
import { Activity, Moon } from "lucide-react";
import { Suspense } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { authClient } from "@/integrations/better-auth/auth-client";
import { orpc } from "@/integrations/orpc/client";
import { ThemeSwitcher } from "@/layout/dashboard/ui/theme-switcher";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamSlug/_dashboard/settings/customization",
)({
   component: PreferencesPage,
});

function PreferencesSectionSkeleton() {
   return (
      <div className="space-y-6">
         <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72 mt-2" />
         </div>
         <div className="space-y-1">
            <Skeleton className="h-16 w-full rounded-lg" />
         </div>
         <div className="space-y-1">
            <Skeleton className="h-16 w-full rounded-lg" />
         </div>
      </div>
   );
}

function PreferencesSectionErrorFallback(props: FallbackProps) {
   return (
      <div className="space-y-6">
         <div>
            <h1 className="text-2xl font-semibold font-serif">
               Personalização
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
               Personalize sua experiência no aplicativo.
            </p>
         </div>
         <Card>
            <CardContent className="py-8">
               {createErrorFallback({
                  errorDescription:
                     "Não foi possível carregar suas preferências",
                  errorTitle: "Erro ao Carregar",
                  retryText: "Tentar novamente",
               })(props)}
            </CardContent>
         </Card>
      </div>
   );
}

// ============================================
// Content Creation Card Component (Pro only)
// ============================================

// ============================================
// Appearance Card Component
// ============================================

function AppearanceSection() {
   return (
      <section className="space-y-3">
         <div>
            <h2 className="text-lg font-medium">Aparência</h2>
            <p className="text-sm text-muted-foreground mt-1">
               Personalize a aparência da interface
            </p>
         </div>
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
      </section>
   );
}

// ============================================
// Privacy Section Component
// ============================================

function PrivacySection({
   hasConsent,
   isPending,
   onConsentChange,
}: {
   hasConsent: boolean;
   isPending: boolean;
   onConsentChange: (consent: boolean) => void;
}) {
   return (
      <section className="space-y-3">
         <div>
            <h2 className="text-lg font-medium">Privacidade</h2>
            <p className="text-sm text-muted-foreground mt-1">
               Controle como seus dados são utilizados
            </p>
         </div>
         <ItemGroup>
            <Item variant="muted">
               <ItemMedia variant="icon">
                  <Activity className="size-4" />
               </ItemMedia>
               <ItemContent className="min-w-0">
                  <ItemTitle>Telemetria</ItemTitle>
                  <ItemDescription className="line-clamp-2">
                     Ajude-nos a melhorar compartilhando dados de uso anônimos
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
      </section>
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
      <div className="space-y-6">
         <div>
            <h1 className="text-2xl font-semibold font-serif">
               Personalização
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
               Personalize sua experiência no aplicativo.
            </p>
         </div>

         <AppearanceSection />

         <PrivacySection
            hasConsent={hasConsent}
            isPending={updateConsentMutation.isPending}
            onConsentChange={(checked) => {
               updateConsentMutation.mutate(checked);
            }}
         />
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
