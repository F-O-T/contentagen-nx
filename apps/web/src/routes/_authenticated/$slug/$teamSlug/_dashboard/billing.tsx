import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { createErrorFallback } from "@packages/ui/components/error-fallback";
import { Separator } from "@packages/ui/components/separator";
import { Skeleton } from "@packages/ui/components/skeleton";
import {
   Tabs,
   TabsContent,
   TabsList,
   TabsTrigger,
} from "@packages/ui/components/tabs";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { BillingOverview } from "@/features/billing/ui/billing-overview";
import { BillingSpend } from "@/features/billing/ui/billing-spend";
import { BillingUsage } from "@/features/billing/ui/billing-usage";
import { EarlyAccessBanner } from "@/features/billing/ui/early-access-banner";

const earlyAccessTemplate = {
   badgeLabel: "Acesso antecipado",
   message:
      "Estamos aprimorando estes dashboards — tem perguntas, ideias ou bugs?",
   ctaLabel: "Fale com a gente",
   bullets: [
      "Dados de uso atualizados diariamente (UTC) — os numeros de hoje aparecem amanha",
      "Gastos historicos e periodos de cobranca sao baseados no plano atual",
      "Para mais detalhes por evento, expanda os cards de produto na aba Overview",
   ],
};

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamSlug/_dashboard/billing",
)({
   component: BillingPage,
});

function BillingSectionErrorFallback(props: FallbackProps) {
   return (
      <Card>
         <CardHeader>
            <CardTitle>Cobranca</CardTitle>
            <CardDescription>
               Gerencie sua cobranca e informacoes de uso.
            </CardDescription>
         </CardHeader>
         <CardContent>
            {createErrorFallback({
               errorDescription: "Erro ao carregar informacoes de cobranca",
               errorTitle: "Erro",
               retryText: "Tentar novamente",
            })(props)}
         </CardContent>
      </Card>
   );
}

function BillingSectionSkeleton() {
   return (
      <div className="space-y-6">
         <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
               <Skeleton className="h-4 w-24" />
               <Skeleton className="h-10 w-40" />
            </div>
            <Skeleton className="h-24 w-full lg:max-w-md" />
         </div>
         <Skeleton className="h-5 w-96" />
         <Skeleton className="h-9 w-56" />
         <div className="space-y-4">
            <Skeleton className="h-6 w-24" />
            {Array.from({ length: 3 }).map((_, i) => (
               <Skeleton
                  className="h-32 w-full"
                  key={`product-skeleton-${i + 1}`}
               />
            ))}
         </div>
      </div>
   );
}

function BillingPage() {
   return (
      <div className="space-y-2">
         <Tabs defaultValue="overview">
            <TabsList variant="line">
               <TabsTrigger value="overview">Geral</TabsTrigger>
               <TabsTrigger value="usage">Uso</TabsTrigger>
               <TabsTrigger value="spend">Gastos</TabsTrigger>
            </TabsList>
            <Separator />

            <TabsContent className="space-y-4" value="overview">
               <ErrorBoundary FallbackComponent={BillingSectionErrorFallback}>
                  <Suspense fallback={<BillingSectionSkeleton />}>
                     <BillingOverview />
                  </Suspense>
               </ErrorBoundary>
            </TabsContent>

            <TabsContent className="space-y-4" value="usage">
               <ErrorBoundary FallbackComponent={BillingSectionErrorFallback}>
                  <Suspense fallback={<BillingSectionSkeleton />}>
                     <EarlyAccessBanner template={earlyAccessTemplate} />
                     <BillingUsage />
                  </Suspense>
               </ErrorBoundary>
            </TabsContent>

            <TabsContent className="space-y-4" value="spend">
               <ErrorBoundary FallbackComponent={BillingSectionErrorFallback}>
                  <Suspense fallback={<BillingSectionSkeleton />}>
                     <EarlyAccessBanner template={earlyAccessTemplate} />

                     <BillingSpend />
                  </Suspense>
               </ErrorBoundary>
            </TabsContent>
         </Tabs>
      </div>
   );
}
