import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import {
   type ChartConfig,
   ChartContainer,
   ChartLegend,
   ChartLegendContent,
   ChartTooltip,
   ChartTooltipContent,
} from "@packages/ui/components/chart";
import {
   Item,
   ItemContent,
   ItemDescription,
   ItemMedia,
   ItemTitle,
} from "@packages/ui/components/item";
import { cn } from "@packages/ui/lib/utils";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Activity, AlertTriangle, Clock, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { orpc } from "@/integrations/orpc/client";

const chartConfig = {
   author: { label: "Autor", color: "var(--chart-1)" },
   list: { label: "Listagem", color: "var(--chart-2)" },
   content: { label: "Conteúdo", color: "var(--chart-3)" },
   image: { label: "Imagem", color: "var(--chart-4)" },
} satisfies ChartConfig;

export function HomeSDKUsageCard({ className }: { className?: string }) {
   const [mounted, setMounted] = useState(false);

   useEffect(() => {
      setMounted(true);
   }, []);

   // Get last 6 months of data for the chart
   const now = new Date();
   const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
   const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
   );

   const { data: monthlyData } = useSuspenseQuery(
      orpc.sdkUsage.getSDKUsageByMonth.queryOptions({
         input: {
            startDate: sixMonthsAgo,
            endDate: endOfMonth,
         },
      }),
   );

   const { data: currentMonth } = useSuspenseQuery(
      orpc.sdkUsage.getCurrentMonthSDKUsage.queryOptions(),
   );

   const totalEndpointRequests =
      currentMonth.authorRequests +
      currentMonth.listRequests +
      currentMonth.contentRequests +
      currentMonth.imageRequests;

   // Generate placeholder data for last 6 months if no data exists
   const generatePlaceholderData = () => {
      const now = new Date();
      const months = [];
      for (let i = 5; i >= 0; i--) {
         const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
         months.push({
            month: date.toLocaleDateString("pt-BR", { month: "short" }),
            author: 0,
            list: 0,
            content: 0,
            image: 0,
         });
      }
      return months;
   };

   const hasApiData =
      monthlyData.length > 0 &&
      monthlyData.some(
         (m) =>
            m.authorRequests > 0 ||
            m.listRequests > 0 ||
            m.contentRequests > 0 ||
            m.imageRequests > 0,
      );

   const chartData = hasApiData
      ? monthlyData.map((month) => ({
           month: new Date(month.month).toLocaleDateString("pt-BR", {
              month: "short",
           }),
           author: month.authorRequests,
           list: month.listRequests,
           content: month.contentRequests,
           image: month.imageRequests,
        }))
      : generatePlaceholderData();

   return (
      <Card className={cn("border-l-4 border-l-primary/80", className)}>
         <CardHeader className="pb-2">
            <div className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase mb-1.5">
               API USAGE • LAST 30 DAYS
            </div>
            <CardTitle className="text-base font-semibold leading-tight mb-1">
               Uso do SDK
            </CardTitle>
            <CardDescription className="text-xs leading-relaxed">
               Estatísticas de uso da API neste mês
            </CardDescription>
         </CardHeader>
         <CardContent className="space-y-4">
            {mounted ? (
               <ChartContainer
                  className="h-[200px] w-full aspect-auto"
                  config={chartConfig}
               >
                  <LineChart
                     data={chartData}
                     margin={{ top: 10, right: 10, bottom: 0, left: 0 }}
                  >
                     <CartesianGrid
                        className="stroke-muted/20"
                        strokeDasharray="0"
                        vertical={false}
                     />
                     <XAxis
                        axisLine={false}
                        className="text-xs"
                        dataKey="month"
                        tickLine={false}
                        tickMargin={8}
                     />
                     <YAxis
                        axisLine={false}
                        className="text-xs"
                        tickLine={false}
                        tickMargin={8}
                        width={40}
                     />
                     <Line
                        dataKey="author"
                        dot={{ r: 3 }}
                        stroke="var(--color-author)"
                        strokeWidth={2}
                        type="monotone"
                     />
                     <Line
                        dataKey="list"
                        dot={{ r: 3 }}
                        stroke="var(--color-list)"
                        strokeWidth={2}
                        type="monotone"
                     />
                     <Line
                        dataKey="content"
                        dot={{ r: 3 }}
                        stroke="var(--color-content)"
                        strokeWidth={2}
                        type="monotone"
                     />
                     <Line
                        dataKey="image"
                        dot={{ r: 3 }}
                        stroke="var(--color-image)"
                        strokeWidth={2}
                        type="monotone"
                     />
                     <ChartTooltip
                        content={(props) => <ChartTooltipContent {...props} />}
                     />
                     <ChartLegend content={<ChartLegendContent />} />
                  </LineChart>
               </ChartContainer>
            ) : (
               <div className="h-[200px] w-full" />
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
               <Item className="rounded-lg" size="sm" variant="muted">
                  <ItemMedia variant="icon">
                     <Zap className="size-4" />
                  </ItemMedia>
                  <ItemContent>
                     <ItemTitle className="text-xl font-bold tabular-nums">
                        {currentMonth.totalRequests.toLocaleString("pt-BR")}
                     </ItemTitle>
                     <ItemDescription>Total de Requisições</ItemDescription>
                  </ItemContent>
               </Item>

               <Item className="rounded-lg" size="sm" variant="muted">
                  <ItemMedia variant="icon">
                     <Activity className="size-4" />
                  </ItemMedia>
                  <ItemContent>
                     <ItemTitle className="text-xl font-bold tabular-nums">
                        {totalEndpointRequests.toLocaleString("pt-BR")}
                     </ItemTitle>
                     <ItemDescription>Buscas de Conteúdo</ItemDescription>
                  </ItemContent>
               </Item>

               <Item className="rounded-lg" size="sm" variant="muted">
                  <ItemMedia variant="icon">
                     <Clock className="size-4" />
                  </ItemMedia>
                  <ItemContent>
                     <ItemTitle className="text-xl font-bold tabular-nums">
                        {Math.round(0)}ms
                     </ItemTitle>
                     <ItemDescription>Latência Média</ItemDescription>
                  </ItemContent>
               </Item>

               <Item className="rounded-lg" size="sm" variant="muted">
                  <ItemMedia variant="icon">
                     <AlertTriangle className="size-4" />
                  </ItemMedia>
                  <ItemContent>
                     <ItemTitle className="text-xl font-bold tabular-nums">
                        {currentMonth.errors.toLocaleString("pt-BR")}
                     </ItemTitle>
                     <ItemDescription>Erros</ItemDescription>
                  </ItemContent>
               </Item>
            </div>
         </CardContent>
      </Card>
   );
}
