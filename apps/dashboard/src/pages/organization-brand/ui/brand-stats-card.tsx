import { useMemo } from "react";
import { StatsCard } from "@packages/ui/components/stats-card";
import type { RouterOutput } from "@packages/api/client";

interface BrandStatsCardProps {
   brand: RouterOutput["brand"]["getByOrganization"];
}

export function BrandStatsCard({ brand }: BrandStatsCardProps) {
   const items = useMemo(() => {
      const features = brand?.features ?? [];
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
                    description: "Features with confidence above 80%",
                    value: String(highCount),
                 },
                 {
                    title: "Medium Confidence",
                    description: "Features with confidence between 50-80%",
                    value: String(mediumCount),
                 },
              ]
            : undefined;

      const avgConfidence =
         totalFeatures > 0 ? Math.round(sumConfidence / totalFeatures) : 0;

      return [
         {
            label: "Total Features",
            description: "Total number of features identified for this brand",
            value: String(totalFeatures),
         },
         {
            label: "Average Confidence",
            description:
               "Average confidence score across all extracted features",
            value: `${avgConfidence}%`,
            details: confidenceDetails,
         },
      ];
   }, [brand?.features]);

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
