import { cn } from "@packages/ui/lib/utils";
import { ArrowDown, ArrowUp } from "lucide-react";
import { memo } from "react";

interface RetentionGridProps {
   data: Array<{ cohort: string; size: number; values: number[] }>;
   periods: string[];
   comparisonCohorts?: Array<{
      cohort: string;
      size: number;
      values: number[];
   }>;
}

function getRetentionColor(percentage: number): string {
   if (percentage >= 80) return "bg-green-600 text-white";
   if (percentage >= 60) return "bg-green-500 text-white";
   if (percentage >= 40) return "bg-green-400 text-white";
   if (percentage >= 20) return "bg-green-300 text-green-900";
   if (percentage > 0) return "bg-green-200 text-green-900";
   return "bg-muted text-muted-foreground";
}

export const RetentionGrid = memo(function RetentionGrid({
   data,
   periods,
   comparisonCohorts,
}: RetentionGridProps) {
   if (data.length === 0) return null;

   return (
      <div className="overflow-x-auto">
         <table className="w-full text-sm">
            <thead>
               <tr className="border-b">
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">
                     Cohort
                  </th>
                  <th className="text-right py-2 px-3 font-medium text-muted-foreground">
                     Size
                  </th>
                  {periods.map((period) => (
                     <th
                        className="text-center py-2 px-3 font-medium text-muted-foreground"
                        key={period}
                     >
                        {period}
                     </th>
                  ))}
               </tr>
            </thead>
            <tbody>
               {data.map((row, rowIndex) => {
                  const compRow = comparisonCohorts?.[rowIndex];
                  return (
                     <tr className="border-b last:border-0" key={row.cohort}>
                        <td className="py-2 px-3 font-medium">{row.cohort}</td>
                        <td className="py-2 px-3 text-right tabular-nums">
                           {row.size.toLocaleString("pt-BR")}
                        </td>
                        {row.values.map((value, i) => {
                           const percentage =
                              row.size > 0 ? (value / row.size) * 100 : 0;

                           const compValue = compRow?.values[i];
                           const compPercentage =
                              compRow &&
                              compRow.size > 0 &&
                              compValue !== undefined
                                 ? (compValue / compRow.size) * 100
                                 : null;

                           const isHigher =
                              compPercentage !== null
                                 ? percentage > compPercentage
                                 : null;

                           return (
                              <td
                                 className="py-1 px-1"
                                 key={`${row.cohort}-${periods[i]}`}
                              >
                                 <div
                                    className={cn(
                                       "rounded px-2 py-1.5 text-center text-xs font-medium tabular-nums relative",
                                       getRetentionColor(percentage),
                                    )}
                                 >
                                    {percentage.toFixed(1)}%
                                    {isHigher !== null && (
                                       <span className="absolute -top-1 -right-1">
                                          {isHigher ? (
                                             <ArrowUp className="size-3 text-green-700" />
                                          ) : (
                                             <ArrowDown className="size-3 text-red-600" />
                                          )}
                                       </span>
                                    )}
                                 </div>
                              </td>
                           );
                        })}
                     </tr>
                  );
               })}
            </tbody>
         </table>
      </div>
   );
});
