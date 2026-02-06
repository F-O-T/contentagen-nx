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
   ItemContent,
   ItemDescription,
   ItemMedia,
   ItemTitle,
} from "@packages/ui/components/item";
import { Progress } from "@packages/ui/components/progress";
import { Skeleton } from "@packages/ui/components/skeleton";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
   Bot,
   FileText,
   MessageSquare,
   Pencil,
   Sparkles,
   Zap,
} from "lucide-react";
import { Suspense } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { AcceptanceRateChart } from "@/features/settings/ui/usage-charts/acceptance-rate-chart";
import { UsageComparisonBadge } from "@/features/settings/ui/usage-charts/usage-comparison-badge";
import { UsageLineChart } from "@/features/settings/ui/usage-charts/usage-line-chart";
import { UsagePieChart } from "@/features/settings/ui/usage-charts/usage-pie-chart";
import { orpc } from "@/integrations/orpc/client";

export const Route = createFileRoute(
   "/_authenticated/$slug/_dashboard/settings/usage",
)({
   component: UsagePage,
});

// ============================================
// Helper Functions
// ============================================

function formatNumber(num: number): string {
   if (num >= 1_000_000) {
      return `${(num / 1_000_000).toFixed(1)}M`;
   }
   if (num >= 1_000) {
      return `${(num / 1_000).toFixed(1)}K`;
   }
   return num.toLocaleString("pt-BR");
}

function formatTokens(tokens: number): string {
   if (tokens >= 1_000_000) {
      return `${(tokens / 1_000_000).toFixed(2)}M`;
   }
   if (tokens >= 1_000) {
      return `${(tokens / 1_000).toFixed(1)}K`;
   }
   return tokens.toLocaleString("pt-BR");
}

// ============================================
// Skeleton Components
// ============================================

function UsageSectionSkeleton() {
   return (
      <div className="space-y-6">
         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
               <Card key={`skeleton-card-${i + 1}`}>
                  <CardHeader className="pb-2">
                     <Skeleton className="h-4 w-24" />
                  </CardHeader>
                  <CardContent>
                     <Skeleton className="h-8 w-32" />
                     <Skeleton className="mt-2 h-3 w-16" />
                  </CardContent>
               </Card>
            ))}
         </div>
         <div className="grid gap-4 md:grid-cols-2">
            <Card>
               <CardHeader>
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-4 w-56" />
               </CardHeader>
               <CardContent>
                  <Skeleton className="h-[200px] w-full" />
               </CardContent>
            </Card>
            <Card>
               <CardHeader>
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-4 w-56" />
               </CardHeader>
               <CardContent>
                  <Skeleton className="h-[200px] w-full" />
               </CardContent>
            </Card>
         </div>
         <Card>
            <CardHeader>
               <Skeleton className="h-6 w-32" />
               <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
               <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                     <Skeleton
                        className="h-16 w-full"
                        key={`skeleton-row-${i + 1}`}
                     />
                  ))}
               </div>
            </CardContent>
         </Card>
      </div>
   );
}

// ============================================
// Error Fallback
// ============================================

function UsageSectionErrorFallback(props: FallbackProps) {
   return (
      <Card>
         <CardHeader>
            <CardTitle>Uso de IA</CardTitle>
            <CardDescription>
               Visualize o consumo de recursos de IA da sua organização.
            </CardDescription>
         </CardHeader>
         <CardContent>
            {createErrorFallback({
               errorDescription: "Erro ao carregar estatísticas de uso",
               errorTitle: "Erro",
               retryText: "Tentar novamente",
            })(props)}
         </CardContent>
      </Card>
   );
}

// ============================================
// Usage Card Component with Comparison
// ============================================

interface UsageCardProps {
   icon: React.ElementType;
   title: string;
   value: string;
   subtitle: string;
   comparisonValue?: number;
}

function UsageCard({
   icon: Icon,
   title,
   value,
   subtitle,
   comparisonValue,
}: UsageCardProps) {
   return (
      <Card>
         <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="size-4 text-muted-foreground" />
         </CardHeader>
         <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            <div className="flex items-center justify-between">
               <p className="text-xs text-muted-foreground">{subtitle}</p>
               {comparisonValue !== undefined && (
                  <UsageComparisonBadge value={comparisonValue} />
               )}
            </div>
         </CardContent>
      </Card>
   );
}

// ============================================
// Feature Usage Row Component
// ============================================

interface FeatureUsageRowProps {
   icon: React.ElementType;
   name: string;
   requests: number;
   inputTokens: number;
   outputTokens: number;
   totalTokens: number;
   totalRequests: number;
}

function FeatureUsageRow({
   icon: Icon,
   name,
   requests,
   inputTokens,
   outputTokens,
   totalTokens,
   totalRequests,
}: FeatureUsageRowProps) {
   const percentage = totalRequests > 0 ? (requests / totalRequests) * 100 : 0;

   return (
      <Item className="py-4" variant="muted">
         <ItemMedia variant="icon">
            <Icon className="size-4" />
         </ItemMedia>
         <ItemContent className="flex-1">
            <div className="flex items-center justify-between">
               <ItemTitle>{name}</ItemTitle>
               <Badge variant="secondary">{formatNumber(requests)} req</Badge>
            </div>
            <ItemDescription className="mt-1">
               {formatTokens(inputTokens)} entrada /{" "}
               {formatTokens(outputTokens)} saída
            </ItemDescription>
            <Progress className="mt-2 h-1.5" value={percentage} />
         </ItemContent>
         <div className="text-right">
            <span className="text-sm font-medium">
               {formatTokens(totalTokens)}
            </span>
            <p className="text-xs text-muted-foreground">tokens</p>
         </div>
      </Item>
   );
}

// ============================================
// Main Content Component
// ============================================

function UsageSectionContent() {
   const { data: usage } = useSuspenseQuery(
      orpc.usage.getExtendedUsage.queryOptions({}),
   );

   return (
      <div className="space-y-6">
         {/* Summary Cards with Comparison */}
         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <UsageCard
               comparisonValue={usage.comparison.requestsChange}
               icon={Zap}
               subtitle="este mês"
               title="Total de Requisições"
               value={formatNumber(usage.totalRequests)}
            />
            <UsageCard
               icon={FileText}
               subtitle="consumidos"
               title="Tokens de Entrada"
               value={formatTokens(usage.totalInputTokens)}
            />
            <UsageCard
               icon={FileText}
               subtitle="gerados"
               title="Tokens de Saída"
               value={formatTokens(usage.totalOutputTokens)}
            />
            <UsageCard
               comparisonValue={usage.comparison.tokensChange}
               icon={Sparkles}
               subtitle="total"
               title="Total de Tokens"
               value={formatTokens(usage.totalTokens)}
            />
         </div>

         {/* Charts Row */}
         <div className="grid gap-4 md:grid-cols-2">
            <UsageLineChart data={usage.dailyUsage} />
            <UsagePieChart data={usage.byFeature} />
         </div>

         {/* Acceptance Rate Chart */}
         {usage.acceptanceRates.length > 0 && (
            <AcceptanceRateChart data={usage.acceptanceRates} />
         )}

         {/* Feature Breakdown */}
         <Card>
            <CardHeader>
               <CardTitle>Uso por Recurso</CardTitle>
               <CardDescription>
                  Distribuição do consumo de IA entre os diferentes recursos
               </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
               <FeatureUsageRow
                  icon={Bot}
                  inputTokens={usage.byFeature.fim.inputTokens}
                  name="Autocompletar (FIM)"
                  outputTokens={usage.byFeature.fim.outputTokens}
                  requests={usage.byFeature.fim.requests}
                  totalRequests={usage.totalRequests}
                  totalTokens={usage.byFeature.fim.totalTokens}
               />
               <FeatureUsageRow
                  icon={Pencil}
                  inputTokens={usage.byFeature.edit.inputTokens}
                  name="Edição Rápida"
                  outputTokens={usage.byFeature.edit.outputTokens}
                  requests={usage.byFeature.edit.requests}
                  totalRequests={usage.totalRequests}
                  totalTokens={usage.byFeature.edit.totalTokens}
               />
               <FeatureUsageRow
                  icon={MessageSquare}
                  inputTokens={usage.byFeature.chat.inputTokens}
                  name="Chat IA (Escritor)"
                  outputTokens={usage.byFeature.chat.outputTokens}
                  requests={usage.byFeature.chat.requests}
                  totalRequests={usage.totalRequests}
                  totalTokens={usage.byFeature.chat.totalTokens}
               />
               <FeatureUsageRow
                  icon={FileText}
                  inputTokens={usage.byFeature.plan.inputTokens}
                  name="Planejamento"
                  outputTokens={usage.byFeature.plan.outputTokens}
                  requests={usage.byFeature.plan.requests}
                  totalRequests={usage.totalRequests}
                  totalTokens={usage.byFeature.plan.totalTokens}
               />
            </CardContent>
         </Card>

         {/* Period Info */}
         <p className="text-center text-xs text-muted-foreground">
            Período: {usage.period}
         </p>
      </div>
   );
}

// ============================================
// Page Component
// ============================================

function UsagePage() {
   return (
      <ErrorBoundary FallbackComponent={UsageSectionErrorFallback}>
         <Suspense fallback={<UsageSectionSkeleton />}>
            <UsageSectionContent />
         </Suspense>
      </ErrorBoundary>
   );
}
