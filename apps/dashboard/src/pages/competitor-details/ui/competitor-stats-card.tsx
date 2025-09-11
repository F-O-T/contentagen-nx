import { StatsCard } from "@packages/ui/components/stats-card";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/integrations/clients";
import { useParams } from "@tanstack/react-router";
import { useMemo } from "react";

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
      const totalFeatures = competitor.features?.length || 0;

      const confidenceDetails =
         competitor.features && competitor.features.length > 0
            ? [
                 {
                    title: "High Confidence",
                    description: "Features with >80% confidence",
                    value: competitor.features
                       .filter((f) => {
                          const meta = (f.meta as any) || {};
                          return (meta.confidence || 0) > 0.8;
                       })
                       .length.toString(),
                 },
                 {
                    title: "Medium Confidence",
                    description: "Features with 50-80% confidence",
                    value: competitor.features
                       .filter((f) => {
                          const meta = (f.meta as any) || {};
                          const confidence = meta.confidence || 0;
                          return confidence > 0.5 && confidence <= 0.8;
                       })
                       .length.toString(),
                 },
              ]
            : undefined;

      const avgConfidence =
         competitor.features && competitor.features.length > 0
            ? Math.round(
                 competitor.features.reduce((acc, f) => {
                    const confidence = ((f.meta as any)?.confidence || 0) * 100;
                    return acc + confidence;
                 }, 0) / competitor.features.length,
              )
            : 0;

      return [
         {
            label: "Total Features",
            description: "All tracked features detected",
            value: totalFeatures.toString(),
         },
         {
            label: "Average Confidence",
            description: "Detection confidence across all features",
            value: `${avgConfidence}%`,
            details: confidenceDetails,
         },
      ];
   }, [competitor]);

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

