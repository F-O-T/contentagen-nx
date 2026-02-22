import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { DataTable } from "@packages/ui/components/data-table";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@packages/ui/components/select";
import { Skeleton } from "@packages/ui/components/skeleton";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState } from "react";
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
// Types
// ============================================

type UsageRow = {
   category: string;
   total: number;
   [date: string]: number | string;
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

   // Transform data into flat rows for DataTable
   const tableData: UsageRow[] = sortedCategories.map((cat) => {
      const row: UsageRow = {
         category: cat,
         total: categoryTotals.get(cat) ?? 0,
      };
      for (const date of allDates) {
         const dayData = usageData.find((d) => d.date === date);
         row[date] = dayData?.countByCategory[cat] ?? 0;
      }
      return row;
   });

   // Build columns dynamically based on dates
   const columns = useMemo<ColumnDef<UsageRow>[]>(() => {
      const cols: ColumnDef<UsageRow>[] = [
         {
            accessorKey: "category",
            header: "Serie",
            enableSorting: false,
            cell: ({ row }) => {
               const cat = row.original.category;
               return (
                  <div className="flex items-center gap-2">
                     <div
                        className="size-2.5 rounded-full shrink-0"
                        style={{
                           backgroundColor: CATEGORY_COLORS[cat] ?? "#94a3b8",
                        }}
                     />
                     <span className="text-sm font-medium">
                        {CATEGORY_LABELS[cat] ?? cat}
                     </span>
                  </div>
               );
            },
         },
         {
            accessorKey: "total",
            header: "Total",
            cell: ({ row }) => (
               <div className="text-right font-medium tabular-nums">
                  {formatNumber(row.original.total)}
               </div>
            ),
         },
         ...allDates.map<ColumnDef<UsageRow>>((date) => ({
            accessorKey: date,
            header: formatShortDate(date),
            enableSorting: false,
            cell: ({ row }) => (
               <div className="text-right tabular-nums text-sm">
                  {formatNumber((row.original[date] as number) ?? 0)}
               </div>
            ),
         })),
      ];
      return cols;
   }, [allDates.join(",")]);

   if (isLoading && !data) {
      return <UsageSkeleton />;
   }

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

         {/* Daily breakdown table */}
         <Card>
            <CardHeader>
               <CardTitle className="text-base">
                  Uso diario por produto
               </CardTitle>
            </CardHeader>
            <CardContent>
               <DataTable
                  columns={columns}
                  data={tableData}
                  getRowId={(row) => row.category}
               />
            </CardContent>
         </Card>
      </div>
   );
}
