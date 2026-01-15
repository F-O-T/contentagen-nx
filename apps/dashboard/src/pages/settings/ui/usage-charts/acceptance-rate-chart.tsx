import type { AcceptanceRateStats } from "@packages/posthog/analytics";
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
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

interface AcceptanceRateChartProps {
   data: AcceptanceRateStats[];
}

const chartConfig = {
   accepted: {
      label: "Aceitos",
      theme: {
         light: "hsl(var(--chart-2))",
         dark: "hsl(var(--chart-2))",
      },
   },
   rejected: {
      label: "Rejeitados",
      theme: {
         light: "hsl(var(--chart-5))",
         dark: "hsl(var(--chart-5))",
      },
   },
} satisfies ChartConfig;

const featureLabels: Record<string, string> = {
   fim: "Autocompletar",
   edit: "Edição Rápida",
};

export function AcceptanceRateChart({ data }: AcceptanceRateChartProps) {
   const chartData = data
      .filter((item) => item.shown > 0)
      .map((item) => ({
         feature: featureLabels[item.feature] || item.feature,
         accepted: item.accepted,
         rejected: item.rejected,
         rate: item.acceptanceRate.toFixed(1),
         total: item.shown,
      }));

   if (chartData.length === 0) {
      return (
         <Card>
            <CardHeader>
               <CardTitle>Taxa de Aceitação</CardTitle>
               <CardDescription>
                  Sugestões de IA aceitas vs rejeitadas
               </CardDescription>
            </CardHeader>
            <CardContent className="flex h-[200px] items-center justify-center">
               <p className="text-sm text-muted-foreground">
                  Nenhum dado de aceitação disponível para este período
               </p>
            </CardContent>
         </Card>
      );
   }

   return (
      <Card>
         <CardHeader>
            <CardTitle>Taxa de Aceitação</CardTitle>
            <CardDescription>
               Sugestões de IA aceitas vs rejeitadas
            </CardDescription>
         </CardHeader>
         <CardContent>
            <ChartContainer className="h-[200px] w-full" config={chartConfig}>
               <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ left: 0, right: 20, top: 10, bottom: 0 }}
               >
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                  <XAxis axisLine={false} tickLine={false} type="number" />
                  <YAxis
                     axisLine={false}
                     dataKey="feature"
                     tickLine={false}
                     type="category"
                     width={100}
                  />
                  <ChartTooltip
                     content={
                        <ChartTooltipContent
                           formatter={(value, name, props) => {
                              const item = props.payload;
                              if (name === "accepted") {
                                 return `Aceitos: ${value} (${item.rate}%)`;
                              }
                              return `Rejeitados: ${value}`;
                           }}
                        />
                     }
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar
                     dataKey="accepted"
                     fill="var(--color-accepted)"
                     radius={[0, 0, 0, 0]}
                     stackId="a"
                  />
                  <Bar
                     dataKey="rejected"
                     fill="var(--color-rejected)"
                     radius={[0, 4, 4, 0]}
                     stackId="a"
                  />
               </BarChart>
            </ChartContainer>
            {/* Acceptance rate labels */}
            <div className="mt-4 flex justify-around">
               {chartData.map((item) => (
                  <div className="text-center" key={item.feature}>
                     <p className="text-2xl font-bold">{item.rate}%</p>
                     <p className="text-xs text-muted-foreground">
                        {item.feature}
                     </p>
                  </div>
               ))}
            </div>
         </CardContent>
      </Card>
   );
}
