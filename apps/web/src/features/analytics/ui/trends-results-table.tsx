import type { TrendsConfig, TrendsResult } from "@packages/analytics/types";

interface TrendsResultsTableProps {
   result: TrendsResult;
   config: TrendsConfig;
}

export function TrendsResultsTable({
   result,
   config,
}: TrendsResultsTableProps) {
   if (!result.data || result.data.length === 0) {
      return null;
   }

   // Extract unique dates and sort them
   const uniqueDates = Array.from(
      new Set(result.data.map((point) => point.intervalStart)),
   ).sort();

   // Build a map for quick lookup: seriesIndex -> date -> count
   const dataMap = new Map<number, Map<string, number>>();

   for (const point of result.data) {
      if (!dataMap.has(point.seriesIndex)) {
         dataMap.set(point.seriesIndex, new Map());
      }
      dataMap.get(point.seriesIndex)?.set(point.intervalStart, point.value);
   }

   // Format date for display
   const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat("pt-BR", {
         day: "numeric",
         month: "short",
      }).format(date);
   };

   // Get color CSS variable for series index
   const getSeriesColor = (index: number) => {
      const colorIndex = (index % 6) + 1;
      return `var(--chart-${colorIndex})`;
   };

   // Get total for a series
   const getSeriesTotal = (seriesIndex: number) => {
      const totalEntry = result.totals.find(
         (t) => t.seriesIndex === seriesIndex,
      );
      return totalEntry?.total ?? 0;
   };

   return (
      <div className="border rounded-lg">
         <div className="px-4 py-3 border-b bg-muted/50">
            <h3 className="text-sm font-medium">Resultados detalhados</h3>
         </div>

         <div className="overflow-x-auto">
            <table className="w-full text-sm">
               <thead>
                  <tr className="border-b bg-muted/30">
                     <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                        SÉRIE
                     </th>
                     <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                        COR
                     </th>
                     <th className="px-4 py-2 text-right font-medium text-muted-foreground">
                        TOTAL
                     </th>
                     {uniqueDates.map((date) => (
                        <th
                           className="px-4 py-2 text-right font-medium text-muted-foreground whitespace-nowrap"
                           key={date}
                        >
                           {formatDate(date)}
                        </th>
                     ))}
                  </tr>
               </thead>
               <tbody>
                  {config.series.map((series, index) => {
                     const seriesData = dataMap.get(index);
                     const total = getSeriesTotal(index);

                     return (
                        <tr
                           className="border-b last:border-0 hover:bg-muted/30"
                           key={index}
                        >
                           <td className="px-4 py-3 font-medium">
                              {series.label || series.event}
                           </td>
                           <td className="px-4 py-3">
                              <div
                                 className="w-3 h-3 rounded-full"
                                 style={{
                                    backgroundColor: getSeriesColor(index),
                                 }}
                              />
                           </td>
                           <td className="px-4 py-3 text-right font-medium">
                              {total.toLocaleString("pt-BR")}
                           </td>
                           {uniqueDates.map((date) => {
                              const count = seriesData?.get(date) ?? 0;
                              return (
                                 <td
                                    className="px-4 py-3 text-right tabular-nums"
                                    key={date}
                                 >
                                    {count.toLocaleString("pt-BR")}
                                 </td>
                              );
                           })}
                        </tr>
                     );
                  })}
               </tbody>
            </table>
         </div>
      </div>
   );
}
