import { useMemo } from "react";
import { StatsCard } from "@packages/ui/components/stats-card";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/integrations/clients";
import { useParams } from "@tanstack/react-router";

export function CompetitorStatsCard() {
   const trpc = useTRPC();
   const id = useParams({
      from: "/_dashboard/competitors/$id",
      select: ({ id }) => id,
   });

   const { data: competitor } = useSuspenseQuery(
      trpc.competitor.get.queryOptions({ id }),
   );

   const items = useMemo(() => {
      const features = competitor?.features ?? [];
      const totalFeatures = features.length;

      let highCount = 0;
      let mediumCount = 0;
      let sumConfidence = 0;

      for (const f of features) {
         const confidence = f.meta?.confidence ?? 0;
         sumConfidence += confidence * 100;
         if (confidence > 0.8) highCount++;
         else if (confidence > 0.5) mediumCount++;
      }

      const confidenceDetails =
         totalFeatures > 0
            ? [
                 {
                    title: "High Confidence",
                    description: "Features with >80% confidence",
                    value: String(highCount),
                 },
                 {
                    title: "Medium Confidence",
                    description: "Features with 50-80% confidence",
                    value: String(mediumCount),
                 },
              ]
            : undefined;

      const avgConfidence =
         totalFeatures > 0 ? Math.round(sumConfidence / totalFeatures) : 0;

      return [
         {
            label: "Total Features",
            description: "All tracked features detected",
            value: String(totalFeatures),
         },
         {
            label: "Average Confidence",
            description: "Detection confidence across all features",
            value: `${avgConfidence}%`,
            details: confidenceDetails,
         },
      ];
   }, [competitor?.features]);

   return (
      <div className="w-full gap-4 grid md:grid-cols-2">
         {items.map((item) => (
            <StatsCard
               key={item.label}
               title={item.label}
               description={item.description}
               value={item.value}
               details={item.details}
            />
         ))}
      </div>
   );
}
