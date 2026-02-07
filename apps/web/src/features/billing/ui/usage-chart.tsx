import {
   Area,
   AreaChart,
   CartesianGrid,
   Legend,
   ResponsiveContainer,
   Tooltip,
   XAxis,
   YAxis,
} from "recharts";

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

const CHART_COLORS: Record<string, string> = {
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

interface UsageChartProps {
   data: Array<{
      date: string;
      total: number;
      byCategory: Record<string, number>;
   }>;
}

// ============================================
// UsageChart Component
// ============================================

export function UsageChart({ data }: UsageChartProps) {
   const chartData = data.map((d) => ({
      date: new Date(d.date).toLocaleDateString("pt-BR", {
         day: "numeric",
         month: "short",
      }),
      total: d.total,
      ...d.byCategory,
   }));

   const categories = [
      ...new Set(data.flatMap((d) => Object.keys(d.byCategory))),
   ];

   return (
      <ResponsiveContainer height={350} width="100%">
         <AreaChart data={chartData}>
            <CartesianGrid className="stroke-border" strokeDasharray="3 3" />
            <XAxis
               axisLine={false}
               className="text-xs fill-muted-foreground"
               dataKey="date"
               tickLine={false}
            />
            <YAxis
               axisLine={false}
               className="text-xs fill-muted-foreground"
               tickFormatter={(value) => `R$ ${value.toFixed(0)}`}
               tickLine={false}
            />
            <Tooltip
               contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.5rem",
               }}
               formatter={(value: number, name: string) => [
                  `R$ ${value.toFixed(2)}`,
                  CATEGORY_LABELS[name] ?? name,
               ]}
            />
            <Legend
               formatter={(value) => CATEGORY_LABELS[value] ?? value}
            />
            {categories.map((cat) => (
               <Area
                  dataKey={cat}
                  fill={CHART_COLORS[cat] ?? "#94a3b8"}
                  fillOpacity={0.1}
                  key={cat}
                  stroke={CHART_COLORS[cat] ?? "#94a3b8"}
                  strokeWidth={2}
                  type="monotone"
               />
            ))}
         </AreaChart>
      </ResponsiveContainer>
   );
}
