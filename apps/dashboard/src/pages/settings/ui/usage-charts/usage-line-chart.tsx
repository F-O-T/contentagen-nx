import type { DailyUsageStats } from "@packages/posthog/analytics";
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
   ChartTooltip,
   ChartTooltipContent,
} from "@packages/ui/components/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

interface UsageLineChartProps {
   data: DailyUsageStats[];
}

const chartConfig = {
   requests: {
      label: "Requisições",
      theme: {
         light: "hsl(var(--chart-1))",
         dark: "hsl(var(--chart-1))",
      },
   },
   tokens: {
      label: "Tokens (K)",
      theme: {
         light: "hsl(var(--chart-2))",
         dark: "hsl(var(--chart-2))",
      },
   },
} satisfies ChartConfig;

function formatDate(dateString: string): string {
   const date = new Date(dateString);
   return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function formatShortDate(dateString: string): string {
   const date = new Date(dateString);
   return date.getDate().toString();
}

export function UsageLineChart({ data }: UsageLineChartProps) {
   // Transform data to include normalized tokens for better visualization
   const chartData = data.map((item) => ({
      ...item,
      dateLabel: formatDate(item.date),
      shortDate: formatShortDate(item.date),
      tokensK: Math.round(item.totalTokens / 1000),
   }));

   if (data.length === 0) {
      return (
         <Card>
            <CardHeader>
               <CardTitle>Uso ao Longo do Tempo</CardTitle>
               <CardDescription>
                  Requisições e tokens consumidos por dia
               </CardDescription>
            </CardHeader>
            <CardContent className="flex h-[200px] items-center justify-center">
               <p className="text-sm text-muted-foreground">
                  Nenhum dado disponível para este período
               </p>
            </CardContent>
         </Card>
      );
   }

   return (
      <Card>
         <CardHeader>
            <CardTitle>Uso ao Longo do Tempo</CardTitle>
            <CardDescription>
               Requisições e tokens consumidos por dia
            </CardDescription>
         </CardHeader>
         <CardContent>
            <ChartContainer className="h-[200px] w-full" config={chartConfig}>
               <AreaChart
                  data={chartData}
                  margin={{ left: 0, right: 0, top: 10, bottom: 0 }}
               >
                  <defs>
                     <linearGradient
                        id="fillRequests"
                        x1="0"
                        x2="0"
                        y1="0"
                        y2="1"
                     >
                        <stop
                           offset="5%"
                           stopColor="var(--color-requests)"
                           stopOpacity={0.8}
                        />
                        <stop
                           offset="95%"
                           stopColor="var(--color-requests)"
                           stopOpacity={0.1}
                        />
                     </linearGradient>
                     <linearGradient
                        id="fillTokens"
                        x1="0"
                        x2="0"
                        y1="0"
                        y2="1"
                     >
                        <stop
                           offset="5%"
                           stopColor="var(--color-tokens)"
                           stopOpacity={0.8}
                        />
                        <stop
                           offset="95%"
                           stopColor="var(--color-tokens)"
                           stopOpacity={0.1}
                        />
                     </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                     axisLine={false}
                     dataKey="shortDate"
                     minTickGap={32}
                     tickLine={false}
                     tickMargin={8}
                  />
                  <YAxis
                     axisLine={false}
                     tickLine={false}
                     tickMargin={8}
                     width={40}
                  />
                  <ChartTooltip
                     content={
                        <ChartTooltipContent
                           labelFormatter={(_, payload) => {
                              if (payload?.[0]) {
                                 return payload[0].payload.dateLabel;
                              }
                              return "";
                           }}
                        />
                     }
                  />
                  <Area
                     dataKey="requests"
                     fill="url(#fillRequests)"
                     stroke="var(--color-requests)"
                     strokeWidth={2}
                     type="monotone"
                  />
                  <Area
                     dataKey="tokensK"
                     fill="url(#fillTokens)"
                     name="tokens"
                     stroke="var(--color-tokens)"
                     strokeWidth={2}
                     type="monotone"
                  />
               </AreaChart>
            </ChartContainer>
         </CardContent>
      </Card>
   );
}
