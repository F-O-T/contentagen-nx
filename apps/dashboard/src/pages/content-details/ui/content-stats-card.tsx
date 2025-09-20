import { StatsCard } from "@packages/ui/components/stats-card";
import { useMemo } from "react";
import { translate } from "@packages/localization";
import type { ContentSelect } from "@packages/database/schema";

interface ContentStatsCardProps {
   content: ContentSelect;
}

export function ContentStatsCard({ content }: ContentStatsCardProps) {
   const items = useMemo(() => {
      const wordCount = Number(content.stats?.wordsCount || 0);
      const qualityScore = content.stats?.qualityScore || 0;

      return [
         {
            label: translate("pages.content-details.stats.word-count"),
            description: translate(
               "pages.content-details.stats.word-count-description",
            ),
            value: wordCount.toLocaleString(),
         },
         {
            label: translate("pages.content-details.stats.content-quality"),
            description: translate(
               "pages.content-details.stats.content-quality-description",
            ),
            value: `${qualityScore}/100`,
         },
      ];
   }, [content]);

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
