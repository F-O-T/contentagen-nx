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
   ItemSeparator,
   ItemTitle,
} from "@packages/ui/components/item";
import { Skeleton } from "@packages/ui/components/skeleton";
import { Switch } from "@packages/ui/components/switch";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { Activity, Globe, Moon, Shield } from "lucide-react";
import { Suspense } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { betterAuthClient, useTRPC } from "@/integrations/clients";
import { LanguageCommand } from "@/layout/language-command";
import { ThemeSwitcher } from "@/layout/theme-provider";

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
            <CardTitle>{"Preferências"}</CardTitle>
            <CardDescription>
               {"Personalize sua experiência no aplicativo."}
            </CardDescription>
         </CardHeader>
         <CardContent>
            {createErrorFallback({
               errorDescription: "Description",
               errorTitle: "Title",
               retryText: "Tentar novamente",
            })(props)}
         </CardContent>
      </Card>
   );
}

// ============================================
// Appearance Card Component
// ============================================

function AppearanceCard() {
   return (
      <Card className="h-full">
         <CardHeader>
            <CardTitle>{"Preferências"}</CardTitle>
            <CardDescription>{"Description"}</CardDescription>
         </CardHeader>
         <CardContent>
            <ItemGroup>
               <Item variant="muted">
                  <ItemMedia variant="icon">
                     <Moon className="size-4" />
                  </ItemMedia>
                  <ItemContent className="min-w-0">
                     <ItemTitle>{"Tema"}</ItemTitle>
                     <ItemDescription className="line-clamp-2">
                        {"Escolha o tema da interface"}
                     </ItemDescription>
                  </ItemContent>
                  <ItemActions>
                     <ThemeSwitcher />
                  </ItemActions>
               </Item>

               <ItemSeparator />

               <Item variant="muted">
                  <ItemMedia variant="icon">
                     <Globe className="size-4" />
                  </ItemMedia>
                  <ItemContent className="min-w-0">
                     <ItemTitle>{"Idioma"}</ItemTitle>
                     <ItemDescription className="line-clamp-2">
                        {"Escolha o idioma da interface"}
                     </ItemDescription>
                  </ItemContent>
                  <ItemActions>
                     <LanguageCommand />
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
            <CardTitle>{"Title"}</CardTitle>
            <CardDescription>{"Description"}</CardDescription>
         </CardHeader>
         <CardContent className="space-y-4">
            <div className="rounded-lg bg-secondary/50 p-4 text-center">
               <p className="text-xs md:text-sm text-muted-foreground mb-1">
                  {"Telemetry Status"}
               </p>
               <div className="flex items-center justify-center gap-2">
                  {hasConsent ? (
                     <>
                        <Shield className="size-5 text-green-500" />
                        <span className="text-lg font-semibold text-green-500">
                           {"Enabled"}
                        </span>
                     </>
                  ) : (
                     <>
                        <Shield className="size-5 text-muted-foreground" />
                        <span className="text-lg font-semibold text-muted-foreground">
                           {"Disabled"}
                        </span>
                     </>
                  )}
               </div>
               <Badge className="mt-2" variant="secondary">
                  {hasConsent ? "Sharing Data" : "Private Data"}
               </Badge>
            </div>

            <ItemGroup>
               <Item variant="muted">
                  <ItemMedia variant="icon">
                     <Activity className="size-4" />
                  </ItemMedia>
                  <ItemContent className="min-w-0">
                     <ItemTitle>{"Title"}</ItemTitle>
                     <ItemDescription className="line-clamp-2">
                        {"Description"}
                     </ItemDescription>
                  </ItemContent>
                  <ItemActions>
                     <Switch
                        aria-label={"Title"}
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
   const trpc = useTRPC();
   const { data: session } = useSuspenseQuery(
      trpc.session.getSession.queryOptions(),
   );

   const updateConsentMutation = useMutation({
      mutationFn: async (consent: boolean) => {
         return betterAuthClient.updateUser({
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

export function PreferencesSection() {
   return (
      <ErrorBoundary FallbackComponent={PreferencesSectionErrorFallback}>
         <Suspense fallback={<PreferencesSectionSkeleton />}>
            <PreferencesSectionContent />
         </Suspense>
      </ErrorBoundary>
   );
}
