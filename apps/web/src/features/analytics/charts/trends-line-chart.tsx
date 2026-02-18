import {
   type ChartConfig,
   ChartContainer,
   ChartLegend,
   ChartLegendContent,
   ChartTooltip,
   ChartTooltipContent,
} from "@packages/ui/components/chart";
import { memo, useMemo } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

interface TrendsLineChartProps {
   data: Array<Record<string, unknown>>;
   series: Array<{ key: string; label: string; color: string }>;
   xAxisKey: string;
   height?: number;
   xAxisFormatter?: (value: string) => string;
   comparisonData?: Array<Record<string, unknown>>;
   formulaData?: Array<{ date: string; value: number }>;
}

export const TrendsLineChart = memo(function TrendsLineChart({
   data,
   series,
   xAxisKey,
   height = 300,
   xAxisFormatter,
   comparisonData,
   formulaData,
}: TrendsLineChartProps) {
   const chartConfig = useMemo(() => {
      const config: ChartConfig = {};
      for (const s of series) {
         config[s.key] = { label: s.label, color: s.color };
      }
      if (comparisonData) {
         for (const s of series) {
            config[`${s.key}_comp`] = {
               label: `${s.label} (prev)`,
               color: s.color,
            };
         }
      }
      if (formulaData) {
         config.__formula_line = {
            label: "Formula",
            color: "var(--chart-6)",
         };
      }
      return config;
   }, [series, comparisonData, formulaData]);

   const mergedData = useMemo(() => {
      let merged = data;

      if (comparisonData) {
         merged = data.map((point, i) => {
            const compPoint = comparisonData[i];
            if (!compPoint) return point;
            const result: Record<string, unknown> = { ...point };
            for (const s of series) {
               if (compPoint[s.key] !== undefined) {
                  result[`${s.key}_comp`] = compPoint[s.key];
               }
            }
            return result;
         });
      }

      if (formulaData) {
         const formulaMap = new Map(formulaData.map((p) => [p.date, p.value]));
         merged = merged.map((point) => ({
            ...point,
            __formula_line: formulaMap.get(String(point[xAxisKey])) ?? null,
         }));
      }

      return merged;
   }, [data, comparisonData, formulaData, series, xAxisKey]);

   return (
      <ChartContainer
         className="w-full aspect-auto"
         config={chartConfig}
         style={{ height: `${height}px` }}
      >
         <LineChart
            data={mergedData}
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
               yAxisId="left"
            />
            {formulaData && (
               <YAxis
                  axisLine={false}
                  className="text-xs"
                  orientation="right"
                  tickLine={false}
                  tickMargin={8}
                  width={40}
                  yAxisId="right"
               />
            )}
            {series.map((s) => (
               <Line
                  dataKey={s.key}
                  dot={{ r: 3 }}
                  key={s.key}
                  stroke={`var(--color-${s.key})`}
                  strokeWidth={2}
                  type="monotone"
                  yAxisId="left"
               />
            ))}
            {comparisonData &&
               series.map((s) => (
                  <Line
                     dataKey={`${s.key}_comp`}
                     dot={false}
                     key={`${s.key}_comp`}
                     stroke={`var(--color-${s.key})`}
                     strokeDasharray="5 5"
                     strokeOpacity={0.4}
                     strokeWidth={1.5}
                     type="monotone"
                     yAxisId="left"
                  />
               ))}
            {formulaData && (
               <Line
                  dataKey="__formula_line"
                  dot={false}
                  stroke="var(--color-__formula_line)"
                  strokeDasharray="3 6"
                  strokeWidth={2}
                  type="monotone"
                  yAxisId="right"
               />
            )}
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
         </LineChart>
      </ChartContainer>
   );
});
