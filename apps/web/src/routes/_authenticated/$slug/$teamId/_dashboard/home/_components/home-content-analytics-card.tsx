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
import { ClientOnly } from "@tanstack/react-router";
import { Clock, Eye, MousePointerClick, Users } from "lucide-react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { orpc } from "@/integrations/orpc/client";

const chartConfig = {
   views: { label: "Visualizações", color: "hsl(var(--chart-1))" },
   visitors: { label: "Visitantes", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig;

function formatDuration(seconds: number): string {
   if (seconds < 60) return `${Math.round(seconds)}s`;
   const minutes = Math.floor(seconds / 60);
   const remainingSeconds = Math.round(seconds % 60);
   return `${minutes}m ${remainingSeconds}s`;
}

export function HomeContentAnalyticsCard({
   className,
}: {
   className?: string;
}) {
   const { data } = useSuspenseQuery(
      orpc.contentAnalytics.getCurrentMonthContentAnalytics.queryOptions({
         input: {},
      }),
   );

   // Generate placeholder data for current month if no data exists
   const generatePlaceholderData = () => {
      const now = new Date();
      const daysInMonth = new Date(
         now.getFullYear(),
         now.getMonth() + 1,
         0,
      ).getDate();
      const currentDay = now.getDate();
      const days = [];

      for (let i = 1; i <= Math.min(currentDay, daysInMonth); i++) {
         const date = new Date(now.getFullYear(), now.getMonth(), i);
         days.push({
            date: date.toISOString().split("T")[0],
            views: 0,
            visitors: 0,
         });
      }
      return days;
   };

   const { dailyStats = [] } = data;
   const chartData =
      dailyStats.length > 0
         ? dailyStats.map((day) => ({
              date: day.date,
              views: day.totalViews,
              visitors: day.uniqueVisitors,
           }))
         : generatePlaceholderData();

   return (
      <Card className={cn(className)}>
         <CardHeader>
            <CardTitle>Analytics de Conteúdo</CardTitle>
            <CardDescription>Métricas de performance deste mês</CardDescription>
         </CardHeader>
         <CardContent className="space-y-4">
            <ClientOnly fallback={<div className="h-[200px] w-full" />}>
               <ChartContainer
                  className="h-[200px] w-full"
                  config={chartConfig}
               >
                  <LineChart
                     data={chartData}
                     margin={{ top: 10, right: 10, bottom: 0, left: 0 }}
                  >
                     <CartesianGrid
                        className="stroke-muted"
                        strokeDasharray="3 3"
                        vertical={false}
                     />
                     <XAxis
                        axisLine={false}
                        className="text-xs"
                        dataKey="date"
                        tickFormatter={(value) => {
                           const date = new Date(value);
                           return date.toLocaleDateString("pt-BR", {
                              day: "numeric",
                           });
                        }}
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
                        dataKey="views"
                        dot={{ r: 3 }}
                        stroke="var(--color-views)"
                        strokeWidth={2}
                        type="monotone"
                     />
                     <Line
                        dataKey="visitors"
                        dot={{ r: 3 }}
                        stroke="var(--color-visitors)"
                        strokeWidth={2}
                        type="monotone"
                     />
                     <ChartTooltip content={<ChartTooltipContent />} />
                     <ChartLegend content={<ChartLegendContent />} />
                  </LineChart>
               </ChartContainer>
            </ClientOnly>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
               <Item className="rounded-lg" size="sm" variant="muted">
                  <ItemMedia variant="icon">
                     <Eye className="size-4" />
                  </ItemMedia>
                  <ItemContent>
                     <ItemTitle className="text-xl font-bold tabular-nums">
                        {data.totalViews.toLocaleString("pt-BR")}
                     </ItemTitle>
                     <ItemDescription>Total de Visualizações</ItemDescription>
                  </ItemContent>
               </Item>

               <Item className="rounded-lg" size="sm" variant="muted">
                  <ItemMedia variant="icon">
                     <Users className="size-4" />
                  </ItemMedia>
                  <ItemContent>
                     <ItemTitle className="text-xl font-bold tabular-nums">
                        {data.uniqueVisitors.toLocaleString("pt-BR")}
                     </ItemTitle>
                     <ItemDescription>Visitantes Únicos</ItemDescription>
                  </ItemContent>
               </Item>

               <Item className="rounded-lg" size="sm" variant="muted">
                  <ItemMedia variant="icon">
                     <Clock className="size-4" />
                  </ItemMedia>
                  <ItemContent>
                     <ItemTitle className="text-xl font-bold tabular-nums">
                        {formatDuration(data.avgTimeSeconds)}
                     </ItemTitle>
                     <ItemDescription>Tempo Médio</ItemDescription>
                  </ItemContent>
               </Item>

               <Item className="rounded-lg" size="sm" variant="muted">
                  <ItemMedia variant="icon">
                     <MousePointerClick className="size-4" />
                  </ItemMedia>
                  <ItemContent>
                     <ItemTitle className="text-xl font-bold tabular-nums">
                        {data.conversionRate.toFixed(1)}%
                     </ItemTitle>
                     <ItemDescription>Taxa de Conversão</ItemDescription>
                  </ItemContent>
               </Item>
            </div>
         </CardContent>
      </Card>
   );
}
