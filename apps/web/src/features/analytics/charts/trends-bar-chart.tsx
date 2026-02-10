import {
   type ChartConfig,
   ChartContainer,
   ChartLegend,
   ChartLegendContent,
   ChartTooltip,
   ChartTooltipContent,
} from "@packages/ui/components/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

interface TrendsBarChartProps {
   data: Array<Record<string, unknown>>;
   series: Array<{ key: string; label: string; color: string }>;
   xAxisKey: string;
   height?: number;
   xAxisFormatter?: (value: string) => string;
   comparisonData?: Array<Record<string, unknown>>;
}

export function TrendsBarChart({
   data,
   series,
   xAxisKey,
   height = 300,
   xAxisFormatter,
   comparisonData,
}: TrendsBarChartProps) {
   const chartConfig: ChartConfig = {};
   for (const s of series) {
      chartConfig[s.key] = { label: s.label, color: s.color };
   }

   if (comparisonData) {
      for (const s of series) {
         chartConfig[`${s.key}_comp`] = {
            label: `${s.label} (prev)`,
            color: s.color,
         };
      }
   }

   // Merge comparison data into main data by index alignment
   let mergedData = data;
   if (comparisonData) {
      mergedData = data.map((point, i) => {
         const compPoint = comparisonData[i];
         if (!compPoint) return point;
         const merged: Record<string, unknown> = { ...point };
         for (const s of series) {
            if (compPoint[s.key] !== undefined) {
               merged[`${s.key}_comp`] = compPoint[s.key];
            }
         }
         return merged;
      });
   }

   return (
      <ChartContainer
         className="w-full"
         config={chartConfig}
         style={{ height }}
      >
         <BarChart
            data={mergedData}
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
               dataKey={xAxisKey}
               tickFormatter={xAxisFormatter}
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
            {comparisonData &&
               series.map((s) => (
                  <Bar
                     dataKey={`${s.key}_comp`}
                     fill={`var(--color-${s.key})`}
                     fillOpacity={0.2}
                     key={`${s.key}_comp`}
                     radius={[4, 4, 0, 0]}
                  />
               ))}
            {series.map((s) => (
               <Bar
                  dataKey={s.key}
                  fill={`var(--color-${s.key})`}
                  key={s.key}
                  radius={[4, 4, 0, 0]}
               />
            ))}
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
         </BarChart>
      </ChartContainer>
   );
}
