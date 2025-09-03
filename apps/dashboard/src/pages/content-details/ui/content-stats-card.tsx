import { StatsCard } from "@packages/ui/components/stats-card";
import { useMemo } from "react";
import type { ContentSelect } from "@packages/database/schema";

interface ContentStatsCardProps {
   content: ContentSelect;
}

export function ContentStatsCard({ content }: ContentStatsCardProps) {
   const items = useMemo(() => {
      const wordCount = content.stats?.wordsCount || 0;
      const qualityScore = content.stats?.qualityScore || 0;

      return [
         {
            label: "Word Count",
            description: "Total words in the content",
            value: wordCount.toString(),
         },
         {
            label: "Content Quality",
            description: "AI-assessed quality score",
            value: qualityScore.toString(),
         },
      ];
   }, [content]);

   return (
      <div className="w-full gap-2 grid md:grid-cols-2">
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
