import { Badge } from "@packages/ui/components/badge";
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { Progress } from "@packages/ui/components/progress";
import { useSuspenseQuery } from "@tanstack/react-query";
import { CalendarDays, Layers, TrendingUp, Wallet } from "lucide-react";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { orpc } from "@/integrations/orpc/client";

// ============================================
// Category display names (pt-BR)
// ============================================

const CATEGORY_LABELS: Record<string, string> = {
   content: "Conteudo",
   ai: "Inteligencia Artificial",
   form: "Formularios",
   seo: "SEO",
   experiment: "Experimentos",
   webhook: "Webhooks",
   system: "Sistema",
};

const CATEGORY_COLORS: Record<string, string> = {
   content: "bg-blue-500",
   ai: "bg-violet-500",
   form: "bg-amber-500",
   seo: "bg-emerald-500",
   experiment: "bg-rose-500",
   webhook: "bg-cyan-500",
   system: "bg-slate-500",
};

// ============================================
// Helper functions
// ============================================

function formatCurrency(value: number): string {
   return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
   });
}

function getBillingPeriod(): string {
   const now = new Date();
   const start = new Date(now.getFullYear(), now.getMonth(), 1);
   const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

   const formatDay = (d: Date) =>
      d.toLocaleDateString("pt-BR", {
         day: "numeric",
         month: "short",
      });

   return `${formatDay(start)} a ${formatDay(end)}, ${end.getFullYear()}`;
}

function getDaysRemaining(): number {
   const now = new Date();
   const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
   return Math.max(
      0,
      Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
   );
}

function getDaysElapsed(): number {
   const now = new Date();
   return now.getDate();
}

function getTotalDaysInMonth(): number {
   const now = new Date();
   return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
}

function getCategoryLabel(category: string): string {
   return CATEGORY_LABELS[category] ?? category;
}

function getCategoryColor(category: string): string {
   return CATEGORY_COLORS[category] ?? "bg-muted-foreground";
}

// ============================================
// CategoryRow Component
// ============================================

interface CategoryData {
   category: string;
   eventCount: number;
   monthToDateCost: number;
   projectedCost: number;
}

function CategoryRow({ category }: { category: CategoryData }) {
   const progressPercent =
      category.projectedCost > 0
         ? Math.min(
              (category.monthToDateCost / category.projectedCost) * 100,
              100,
           )
         : 0;

   return (
      <div className="space-y-2">
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
               <div
                  className={`size-2.5 rounded-full shrink-0 ${getCategoryColor(category.category)}`}
               />
               <span className="text-sm font-medium truncate">
                  {getCategoryLabel(category.category)}
               </span>
               <Badge variant="secondary">
                  {category.eventCount.toLocaleString("pt-BR")}{" "}
                  {category.eventCount === 1 ? "evento" : "eventos"}
               </Badge>
            </div>
            <div className="flex items-center gap-4 shrink-0">
               <div className="text-right">
                  <span className="text-sm font-medium tabular-nums">
                     {formatCurrency(category.monthToDateCost)}
                  </span>
               </div>
            </div>
         </div>

         <div className="flex items-center gap-3">
            <Progress className="h-1.5 flex-1" value={progressPercent} />
            <span className="text-xs text-muted-foreground tabular-nums shrink-0">
               Projetado: {formatCurrency(category.projectedCost)}
            </span>
         </div>
      </div>
   );
}

// ============================================
// BillingOverview Component
// ============================================

export function BillingOverview() {
   const { data } = useSuspenseQuery(
      orpc.billing.getCurrentUsage.queryOptions({}),
   );

   const { activeSubscription } = useActiveOrganization();

   const daysRemaining = getDaysRemaining();
   const daysElapsed = getDaysElapsed();
   const totalDays = getTotalDaysInMonth();
   const periodProgress = Math.round((daysElapsed / totalDays) * 100);

   const planLabel = activeSubscription
      ? (activeSubscription.plan as string).toUpperCase()
      : "FREE";

   // Sort categories by cost descending
   const sortedCategories = [...data.byCategory].sort(
      (a, b) => b.monthToDateCost - a.monthToDateCost,
   );

   const totalEvents = data.byCategory.reduce(
      (sum, cat) => sum + cat.eventCount,
      0,
   );

   return (
      <div className="space-y-6">
         {/* Summary Cards */}
         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Total Bill Card */}
            <Card>
               <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                     Total do mes
                  </CardTitle>
                  <Wallet className="size-4 text-muted-foreground" />
               </CardHeader>
               <CardContent>
                  <div className="text-2xl font-bold tabular-nums">
                     {formatCurrency(data.monthToDate)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                     Projecao: {formatCurrency(data.projected)}
                  </p>
               </CardContent>
            </Card>

            {/* Projected Cost Card */}
            <Card>
               <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                     Projecao final
                  </CardTitle>
                  <TrendingUp className="size-4 text-muted-foreground" />
               </CardHeader>
               <CardContent>
                  <div className="text-2xl font-bold tabular-nums">
                     {formatCurrency(data.projected)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                     Baseado no uso ate agora
                  </p>
               </CardContent>
            </Card>

            {/* Billing Period Card */}
            <Card>
               <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                     Periodo de cobranca
                  </CardTitle>
                  <CalendarDays className="size-4 text-muted-foreground" />
               </CardHeader>
               <CardContent>
                  <div className="text-sm font-semibold">
                     {getBillingPeriod()}
                  </div>
                  <div className="mt-2 space-y-1">
                     <Progress className="h-1.5" value={periodProgress} />
                     <p className="text-xs text-muted-foreground">
                        {daysRemaining}{" "}
                        {daysRemaining === 1
                           ? "dia restante"
                           : "dias restantes"}
                     </p>
                  </div>
               </CardContent>
            </Card>

            {/* Active Categories Card */}
            <Card>
               <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                     Eventos no mes
                  </CardTitle>
                  <Layers className="size-4 text-muted-foreground" />
               </CardHeader>
               <CardContent>
                  <div className="text-2xl font-bold tabular-nums">
                     {totalEvents.toLocaleString("pt-BR")}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                     {data.byCategory.length}{" "}
                     {data.byCategory.length === 1
                        ? "categoria ativa"
                        : "categorias ativas"}
                  </p>
               </CardContent>
            </Card>
         </div>

         {/* Plan Context Banner */}
         {activeSubscription && (
            <Card className="bg-secondary/30 border-dashed">
               <CardContent className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-2">
                     <Badge variant="outline">{planLabel}</Badge>
                     <span className="text-sm text-muted-foreground">
                        Custos baseados em uso alem do plano
                     </span>
                  </div>
               </CardContent>
            </Card>
         )}

         {!activeSubscription && (
            <Card className="bg-secondary/30 border-dashed">
               <CardContent className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-2">
                     <Badge variant="secondary">Pay-as-you-go</Badge>
                     <span className="text-sm text-muted-foreground">
                        Cobranca baseada no uso mensal de eventos
                     </span>
                  </div>
               </CardContent>
            </Card>
         )}

         {/* Category Breakdown */}
         <Card>
            <CardHeader>
               <CardTitle>Gastos por categoria</CardTitle>
               <CardDescription>
                  Resumo dos custos por categoria de eventos neste periodo
               </CardDescription>
            </CardHeader>
            <CardContent>
               <div className="space-y-5">
                  {sortedCategories.map((cat) => (
                     <CategoryRow category={cat} key={cat.category} />
                  ))}
                  {sortedCategories.length === 0 && (
                     <p className="text-sm text-muted-foreground text-center py-6">
                        Nenhum evento registrado neste periodo
                     </p>
                  )}
               </div>
            </CardContent>
         </Card>
      </div>
   );
}
