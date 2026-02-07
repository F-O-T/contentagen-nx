import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@packages/ui/components/select";
import { Skeleton } from "@packages/ui/components/skeleton";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { orpc } from "@/integrations/orpc/client";
import { UsageChart } from "@/features/billing/ui/usage-chart";

// ============================================
// Helper functions
// ============================================

function formatCurrency(value: number): string {
   return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
   });
}

// ============================================
// Loading Skeleton
// ============================================

function SpendSkeleton() {
   return (
      <div className="space-y-6">
         <Card>
            <CardHeader>
               <div className="flex items-center justify-between">
                  <div className="space-y-2">
                     <Skeleton className="h-6 w-40" />
                     <Skeleton className="h-4 w-64" />
                  </div>
                  <Skeleton className="h-10 w-40" />
               </div>
            </CardHeader>
            <CardContent>
               <Skeleton className="h-[350px] w-full" />
            </CardContent>
         </Card>

         <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
               <Card key={`spend-skeleton-${i}`}>
                  <CardHeader className="pb-2">
                     <Skeleton className="h-4 w-24" />
                  </CardHeader>
                  <CardContent>
                     <Skeleton className="h-8 w-28" />
                     <Skeleton className="mt-1 h-3 w-20" />
                  </CardContent>
               </Card>
            ))}
         </div>
      </div>
   );
}

// ============================================
// BillingSpend Component
// ============================================

export function BillingSpend() {
   const [days, setDays] = useState(30);

   const { data, isLoading } = useQuery({
      ...orpc.billing.getDailyUsage.queryOptions({ input: { days } }),
      placeholderData: keepPreviousData,
   });

   if (isLoading && !data) {
      return <SpendSkeleton />;
   }

   const usageData = data ?? [];

   const totalSpend = usageData.reduce((sum, d) => sum + d.total, 0);
   const avgDaily = totalSpend / (usageData.length || 1);
   const maxDay =
      usageData.length > 0 ? Math.max(...usageData.map((d) => d.total)) : 0;

   return (
      <div className="space-y-6">
         {/* Chart Card */}
         <Card>
            <CardHeader>
               <div className="flex items-center justify-between">
                  <div>
                     <CardTitle>Gastos diarios</CardTitle>
                     <CardDescription>
                        Acompanhe seus gastos ao longo do tempo
                     </CardDescription>
                  </div>
                  <Select
                     onValueChange={(v) => setDays(Number(v))}
                     value={String(days)}
                  >
                     <SelectTrigger className="w-40">
                        <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                        <SelectItem value="7">Ultimos 7 dias</SelectItem>
                        <SelectItem value="30">Ultimos 30 dias</SelectItem>
                        <SelectItem value="90">Ultimos 90 dias</SelectItem>
                     </SelectContent>
                  </Select>
               </div>
            </CardHeader>
            <CardContent>
               {usageData.length === 0 ? (
                  <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                     Nenhum dado de gastos neste periodo
                  </div>
               ) : (
                  <UsageChart data={usageData} />
               )}
            </CardContent>
         </Card>

         {/* Summary Stats */}
         <div className="grid gap-4 md:grid-cols-3">
            <Card>
               <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                     Gasto total
                  </CardTitle>
               </CardHeader>
               <CardContent>
                  <div className="text-2xl font-bold tabular-nums">
                     {formatCurrency(totalSpend)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                     nos ultimos {days} dias
                  </p>
               </CardContent>
            </Card>
            <Card>
               <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                     Media diaria
                  </CardTitle>
               </CardHeader>
               <CardContent>
                  <div className="text-2xl font-bold tabular-nums">
                     {formatCurrency(avgDaily)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                     por dia
                  </p>
               </CardContent>
            </Card>
            <Card>
               <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                     Maior gasto diario
                  </CardTitle>
               </CardHeader>
               <CardContent>
                  <div className="text-2xl font-bold tabular-nums">
                     {formatCurrency(maxDay)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                     pico no periodo
                  </p>
               </CardContent>
            </Card>
         </div>
      </div>
   );
}
