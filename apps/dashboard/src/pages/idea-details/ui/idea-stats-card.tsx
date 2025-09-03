import { StatsCard } from "@packages/ui/components/stats-card";
import { useMemo } from "react";
import type { IdeaSelect } from "@packages/database/schema";

interface IdeaStatsCardProps {
   idea: IdeaSelect;
}

export function IdeaStatsCard({ idea }: IdeaStatsCardProps) {
   const items = useMemo(() => {
      return [
         {
            label: "Confidence Score",
            description: "AI confidence in this idea's potential",
            value: `${idea.confidence.score}%`,
         },
         {
            label: "Total keywords",
            description: "Total keywords associated with this idea",
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
