import { cn } from "@packages/ui/lib/utils";
import { memo } from "react";

interface FunnelStep {
   name: string;
   count: number;
}

interface FunnelChartProps {
   steps: FunnelStep[];
   height?: number;
   comparisonSteps?: FunnelStep[];
}

export const FunnelChart = memo(function FunnelChart({
   steps,
   comparisonSteps,
}: FunnelChartProps) {
   if (steps.length === 0) return null;
   const maxCount = Math.max(steps[0].count, comparisonSteps?.[0]?.count ?? 0);

   return (
      <div className="space-y-3">
         {steps.map((step, index) => {
            const percentage = maxCount > 0 ? (step.count / maxCount) * 100 : 0;
            const dropOff =
               index > 0
                  ? (
                       ((steps[index - 1].count - step.count) /
                          steps[index - 1].count) *
                       100
                    ).toFixed(1)
                  : null;

            const compStep = comparisonSteps?.[index];
            const compPercentage =
               compStep && maxCount > 0 ? (compStep.count / maxCount) * 100 : 0;

            // Calculate conversion change in percentage points
            let conversionChange: string | null = null;
            if (compStep && index > 0) {
               const currentConv =
                  steps[index - 1].count > 0
                     ? (step.count / steps[index - 1].count) * 100
                     : 0;
               const prevConv =
                  comparisonSteps[index - 1].count > 0
                     ? (compStep.count / comparisonSteps[index - 1].count) * 100
                     : 0;
               const diff = currentConv - prevConv;
               conversionChange = `${diff >= 0 ? "+" : ""}${diff.toFixed(1)} pp`;
            }

            return (
               <div className="space-y-1" key={`funnel-step-${index + 1}`}>
                  <div className="flex items-center justify-between text-sm">
                     <div className="flex items-center gap-2">
                        <span className="text-muted-foreground font-mono text-xs w-5">
                           {index + 1}
                        </span>
                        <span className="font-medium">{step.name}</span>
                     </div>
                     <div className="flex items-center gap-3">
                        <span className="tabular-nums font-medium">
                           {step.count.toLocaleString("pt-BR")}
                        </span>
                        <span className="tabular-nums text-muted-foreground text-xs w-12 text-right">
                           {percentage.toFixed(1)}%
                        </span>
                        {conversionChange && (
                           <span
                              className={cn(
                                 "tabular-nums text-xs w-16 text-right",
                                 conversionChange.startsWith("+")
                                    ? "text-green-600"
                                    : "text-red-600",
                              )}
                           >
                              {conversionChange}
                           </span>
                        )}
                     </div>
                  </div>
                  <div className="relative h-8 bg-muted rounded overflow-hidden">
                     {compStep && (
                        <div
                           className="absolute inset-y-0 left-0 rounded bg-primary/15 transition-all duration-500"
                           style={{ width: `${compPercentage}%` }}
                        />
                     )}
                     <div
                        className={cn(
                           "relative h-full rounded transition-all duration-500",
                           index === 0 ? "bg-primary" : "bg-primary/70",
                        )}
                        style={{ width: `${percentage}%` }}
                     />
                  </div>
                  {dropOff !== null && (
                     <p className="text-xs text-muted-foreground pl-7">
                        {dropOff}% drop-off
                     </p>
                  )}
               </div>
            );
         })}
      </div>
   );
});
