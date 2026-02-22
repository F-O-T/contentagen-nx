import { Badge } from "@packages/ui/components/badge";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Crown, TrendingUp } from "lucide-react";
import { orpc } from "@/integrations/orpc/client";

interface ExperimentResultsTabProps {
   experimentId: string;
}

const GOAL_LABELS: Record<string, string> = {
   conversion: "Conversão",
   ctr: "CTR",
   time_on_page: "Tempo na página",
   form_submit: "Envio de formulário",
};

function formatRate(rate: number) {
   return `${(rate * 100).toFixed(2)}%`;
}

function StatCard({
   label,
   value,
   sub,
}: {
   label: string;
   value: string;
   sub?: string;
}) {
   return (
      <div className="flex flex-col gap-1 rounded-lg border bg-card px-4 py-3">
         <span className="text-xs text-muted-foreground">{label}</span>
         <span className="text-2xl font-bold tracking-tight">{value}</span>
         {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
      </div>
   );
}

export function ExperimentResultsTab({
   experimentId,
}: ExperimentResultsTabProps) {
   const { data } = useSuspenseQuery(
      orpc.experiments.getResults.queryOptions({
         input: { experimentId },
      }),
   );

   const { experiment, variants } = data;
   const hasData = variants.some((v) => v.totalImpressions > 0);
   const goal = GOAL_LABELS[experiment.goal] ?? experiment.goal;

   if (!hasData) {
      return (
         <div className="flex flex-col items-center justify-center py-16 gap-3 text-center border rounded-lg border-dashed">
            <TrendingUp className="size-10 text-muted-foreground/40" />
            <div className="flex flex-col gap-1">
               <p className="text-sm font-medium">Nenhum dado ainda</p>
               <p className="text-sm text-muted-foreground">
                  Os resultados aparecerão aqui quando o experimento estiver em
                  execução e coletar impressões.
               </p>
            </div>
         </div>
      );
   }

   const totalImpressions = variants.reduce(
      (sum, v) => sum + v.totalImpressions,
      0,
   );
   const totalConversions = variants.reduce(
      (sum, v) => sum + v.totalConversions,
      0,
   );
   const overallRate =
      totalImpressions > 0 ? totalConversions / totalImpressions : 0;

   // Sort by conversion rate descending
   const sortedVariants = [...variants].sort(
      (a, b) => b.conversionRate - a.conversionRate,
   );

   return (
      <div className="flex flex-col gap-6">
         {/* Summary stats */}
         <div className="grid grid-cols-3 gap-3">
            <StatCard
               label="Impressões totais"
               value={totalImpressions.toLocaleString("pt-BR")}
            />
            <StatCard
               label="Conversões totais"
               sub={`Métrica: ${goal}`}
               value={totalConversions.toLocaleString("pt-BR")}
            />
            <StatCard
               label="Taxa geral"
               sub="Média ponderada"
               value={formatRate(overallRate)}
            />
         </div>

         {/* Per-variant breakdown */}
         <div className="flex flex-col gap-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
               Por variante
            </h3>
            <div className="flex flex-col gap-2">
               {sortedVariants.map((item, index) => {
                  const isTop = index === 0 && item.totalImpressions > 0;
                  const progressPct =
                     sortedVariants[0]?.conversionRate > 0
                        ? (item.conversionRate /
                             sortedVariants[0].conversionRate) *
                          100
                        : 0;

                  return (
                     <div
                        className="rounded-lg border bg-card p-4 flex flex-col gap-3"
                        key={item.variant.id}
                     >
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">
                                 {item.variant.name}
                              </span>
                              {item.variant.isControl && (
                                 <Badge variant="outline">Controle</Badge>
                              )}
                              {item.isWinner && (
                                 <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                    <Crown className="size-3" />
                                    Vencedor
                                 </span>
                              )}
                              {isTop && !item.isWinner && (
                                 <Badge variant="default">Melhor</Badge>
                              )}
                           </div>
                           <span className="text-lg font-bold tabular-nums">
                              {formatRate(item.conversionRate)}
                           </span>
                        </div>

                        {/* Progress bar */}
                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                           <div
                              className="h-full rounded-full bg-primary transition-all duration-500"
                              style={{ width: `${progressPct}%` }}
                           />
                        </div>

                        <div className="flex gap-4 text-xs text-muted-foreground">
                           <span>
                              {item.totalImpressions.toLocaleString("pt-BR")}{" "}
                              impressões
                           </span>
                           <span>
                              {item.totalConversions.toLocaleString("pt-BR")}{" "}
                              conversões
                           </span>
                        </div>
                     </div>
                  );
               })}
            </div>
         </div>

         {experiment.concludedAt && (
            <p className="text-xs text-center text-muted-foreground">
               Experimento concluído em{" "}
               {new Date(experiment.concludedAt).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
               })}
            </p>
         )}
      </div>
   );
}
