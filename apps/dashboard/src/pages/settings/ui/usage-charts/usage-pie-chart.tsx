import type { FeatureUsageStats } from "@packages/posthog/analytics";
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
import { Cell, Pie, PieChart } from "recharts";

interface UsagePieChartProps {
   data: {
      fim: FeatureUsageStats;
      chat: FeatureUsageStats;
      edit: FeatureUsageStats;
      plan: FeatureUsageStats;
   };
}

const chartConfig = {
   fim: {
      label: "Autocompletar (FIM)",
      theme: {
         light: "hsl(var(--chart-1))",
         dark: "hsl(var(--chart-1))",
      },
   },
   chat: {
      label: "Chat IA",
      theme: {
         light: "hsl(var(--chart-2))",
         dark: "hsl(var(--chart-2))",
      },
   },
   edit: {
      label: "Edição Rápida",
      theme: {
         light: "hsl(var(--chart-3))",
         dark: "hsl(var(--chart-3))",
      },
   },
   plan: {
      label: "Planejamento",
      theme: {
         light: "hsl(var(--chart-4))",
         dark: "hsl(var(--chart-4))",
      },
   },
} satisfies ChartConfig;

const COLORS = [
   "var(--color-fim)",
   "var(--color-chat)",
   "var(--color-edit)",
   "var(--color-plan)",
];

export function UsagePieChart({ data }: UsagePieChartProps) {
   const chartData = [
      { name: "fim", value: data.fim.requests, label: "Autocompletar (FIM)" },
      { name: "chat", value: data.chat.requests, label: "Chat IA" },
      { name: "edit", value: data.edit.requests, label: "Edição Rápida" },
      { name: "plan", value: data.plan.requests, label: "Planejamento" },
   ].filter((item) => item.value > 0);

   const totalRequests = chartData.reduce((sum, item) => sum + item.value, 0);

   if (totalRequests === 0) {
      return (
         <Card>
            <CardHeader>
               <CardTitle>Distribuição por Recurso</CardTitle>
               <CardDescription>
                  Uso de IA por tipo de funcionalidade
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
            <CardTitle>Distribuição por Recurso</CardTitle>
            <CardDescription>
               Uso de IA por tipo de funcionalidade
            </CardDescription>
         </CardHeader>
         <CardContent>
            <ChartContainer
               className="mx-auto h-[200px] w-full"
               config={chartConfig}
            >
               <PieChart>
                  <ChartTooltip
                     content={
                        <ChartTooltipContent
                           formatter={(value, name) => {
                              const percentage = (
                                 (Number(value) / totalRequests) *
                                 100
                              ).toFixed(1);
                              return (
                                 <span>
                                    {
                                       chartConfig[
                                          name as keyof typeof chartConfig
                                       ]?.label
                                    }
                                    : {value} ({percentage}%)
                                 </span>
                              );
                           }}
                        />
                     }
                  />
                  <Pie
                     cx="50%"
                     cy="50%"
                     data={chartData}
                     dataKey="value"
                     innerRadius={50}
                     nameKey="name"
                     outerRadius={80}
                     paddingAngle={2}
                  >
                     {chartData.map((entry) => (
                        <Cell
                           fill={
                              COLORS[
                                 ["fim", "chat", "edit", "plan"].indexOf(
                                    entry.name,
                                 )
                              ]
                           }
                           key={`cell-${entry.name}`}
                        />
                     ))}
                  </Pie>
                  <ChartLegend
                     content={<ChartLegendContent nameKey="name" />}
                  />
               </PieChart>
            </ChartContainer>
         </CardContent>
      </Card>
   );
}
