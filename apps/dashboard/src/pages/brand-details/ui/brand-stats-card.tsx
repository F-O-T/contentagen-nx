import { useMemo } from "react";
import { StatsCard } from "@packages/ui/components/stats-card";
import { translate } from "@packages/localization";
import type { BrandSelect } from "@packages/database/schema";

interface BrandStatsCardProps {
   brand: BrandSelect;
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
                    title: translate(
                       "pages.brand-details.stats.high-confidence",
                    ),
                    description: translate(
                       "pages.brand-details.stats.high-confidence-description",
                    ),
                    value: String(highCount),
                 },
                 {
                    title: translate(
                       "pages.brand-details.stats.medium-confidence",
                    ),
                    description: translate(
                       "pages.brand-details.stats.medium-confidence-description",
                    ),
                    value: String(mediumCount),
                 },
              ]
            : undefined;

      const avgConfidence =
         totalFeatures > 0 ? Math.round(sumConfidence / totalFeatures) : 0;

      return [
         {
            label: translate("pages.brand-details.stats.total-features"),
            description: translate(
               "pages.brand-details.stats.total-features-description",
            ),
            value: String(totalFeatures),
         },
         {
            label: translate(
               "pages.brand-details.stats.average-confidence",
            ),
            description: translate(
               "pages.brand-details.stats.average-confidence-description",
            ),
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