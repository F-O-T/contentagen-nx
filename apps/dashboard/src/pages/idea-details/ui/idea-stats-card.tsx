import { StatsCard } from "@packages/ui/components/stats-card";
import { useMemo } from "react";
import { translate } from "@packages/localization";
import type { IdeaSelect } from "@packages/database/schema";

interface IdeaStatsCardProps {
   idea: IdeaSelect;
}

export function IdeaStatsCard({ idea }: IdeaStatsCardProps) {
   const items = useMemo(() => {
      return [
         {
            label: translate("pages.idea-details.stats.confidence-score"),
            description: translate(
               "pages.idea-details.stats.confidence-score-description",
            ),
            value: `${idea.confidence.score}%`,
         },
         {
            label: translate("pages.idea-details.stats.total-keywords"),
            description: translate(
               "pages.idea-details.stats.total-keywords-description",
            ),
            value: idea.meta?.tags?.length?.toString() || "0",
         },
      ];
   }, [idea]);

   return (
      <div className="w-full gap-4 grid md:grid-cols-2">
         {items.map((item) => (
            <StatsCard
               key={item.label}
               title={item.label}
               description={item.description}
               value={item.value}
            />
         ))}
      </div>
   );
}
