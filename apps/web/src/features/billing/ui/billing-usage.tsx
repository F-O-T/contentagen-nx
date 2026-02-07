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
import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
} from "@packages/ui/components/table";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { UsageChart } from "@/features/billing/ui/usage-chart";
import { orpc } from "@/integrations/orpc/client";

// ============================================
// Constants
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
   content: "#3b82f6",
   ai: "#8b5cf6",
   form: "#f59e0b",
   seo: "#10b981",
   experiment: "#f43f5e",
   webhook: "#06b6d4",
   system: "#64748b",
};

// ============================================
// Helpers
// ============================================

function formatNumber(value: number): string {
   return value.toLocaleString("pt-BR");
}

function formatShortDate(dateStr: string): string {
   const d = new Date(dateStr);
   return d
      .toLocaleDateString("pt-BR", { day: "numeric", month: "short" })
      .toUpperCase();
}

// ============================================
// Loading Skeleton
// ============================================

function UsageSkeleton() {
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
         <Card>
            <CardHeader>
               <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
               <Skeleton className="h-48 w-full" />
            </CardContent>
         </Card>
      </div>
   );
}

// ============================================
// BillingUsage Component
// ============================================

export function BillingUsage() {
   const [days, setDays] = useState(30);

   const { data, isLoading } = useQuery({
      ...orpc.billing.getDailyUsage.queryOptions({ input: { days } }),
      placeholderData: keepPreviousData,
   });

   if (isLoading && !data) {
      return <UsageSkeleton />;
   }

   const usageData = data ?? [];

   // Build chart data using countByCategory for the line chart
   const chartData = usageData.map((d) => ({
      date: d.date,
      total: d.totalCount,
      byCategory: d.countByCategory,
   }));

   // Always include all known categories
   const allCategories = Object.keys(CATEGORY_LABELS);
   const allDates = usageData.map((d) => d.date);

   // Build totals per category
   const categoryTotals = new Map<string, number>();
   for (const cat of allCategories) {
      categoryTotals.set(cat, 0);
   }
   for (const d of usageData) {
      for (const [cat, count] of Object.entries(d.countByCategory)) {
         categoryTotals.set(cat, (categoryTotals.get(cat) ?? 0) + count);
      }
   }

   // Sort categories by total descending
   const sortedCategories = [...allCategories].sort(
      (a, b) => (categoryTotals.get(b) ?? 0) - (categoryTotals.get(a) ?? 0),
   );

   return (
      <div className="space-y-6">
         {/* Chart Card */}
         <Card>
            <CardHeader>
               <div className="flex items-center justify-between">
                  <div>
                     <CardTitle>Uso diario</CardTitle>
                     <CardDescription>
                        Eventos processados por dia, agrupados por produto
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
               <UsageChart data={chartData} mode="count" />
            </CardContent>
         </Card>

         {/* Daily breakdown table - always shown */}
         <Card>
            <CardHeader>
               <CardTitle className="text-base">
                  Uso diario por produto
               </CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
               <Table>
                  <TableHeader>
                     <TableRow>
                        <TableHead className="sticky left-0 bg-card z-10 min-w-[180px]">
                           Serie
                        </TableHead>
                        <TableHead className="text-right min-w-[80px]">
                           Total
                        </TableHead>
                        {allDates.map((date) => (
                           <TableHead
                              className="text-right min-w-[70px] text-xs"
                              key={date}
                           >
                              {formatShortDate(date)}
                           </TableHead>
                        ))}
                     </TableRow>
                  </TableHeader>
                  <TableBody>
                     {sortedCategories.map((cat) => (
                        <TableRow key={cat}>
                           <TableCell className="sticky left-0 bg-card z-10">
                              <div className="flex items-center gap-2">
                                 <div
                                    className="size-2.5 rounded-full shrink-0"
                                    style={{
                                       backgroundColor:
                                          CATEGORY_COLORS[cat] ?? "#94a3b8",
                                    }}
                                 />
                                 <span className="text-sm font-medium">
                                    {CATEGORY_LABELS[cat] ?? cat}
                                 </span>
                              </div>
                           </TableCell>
                           <TableCell className="text-right font-medium tabular-nums">
                              {formatNumber(categoryTotals.get(cat) ?? 0)}
                           </TableCell>
                           {allDates.map((date) => {
                              const dayData = usageData.find(
                                 (d) => d.date === date,
                              );
                              const count = dayData?.countByCategory[cat] ?? 0;
                              return (
                                 <TableCell
                                    className="text-right tabular-nums text-sm"
                                    key={`${cat}-${date}`}
                                 >
                                    {formatNumber(count)}
                                 </TableCell>
                              );
                           })}
                        </TableRow>
                     ))}
                  </TableBody>
               </Table>
            </CardContent>
         </Card>
      </div>
   );
}
