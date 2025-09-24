// apps/dashboard/src/pages/agent-details/ui/agent-stats-card.tsx

import { StatsCard } from "@packages/ui/components/stats-card";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/integrations/clients";
import { useParams } from "@tanstack/react-router";
import { useMemo } from "react";
import { translate } from "@packages/localization";

export function AgentStatsCard() {
   const trpc = useTRPC();
   const id = useParams({
      from: "/_dashboard/agents/$agentId/",
      select: ({ agentId }) => agentId,
   });
   const { data } = useSuspenseQuery(
      trpc.agent.stats.queryOptions({
         id,
      }),
   );

   const items = useMemo(() => {
      const drafts = {
         title: translate("pages.agent-details.stats.drafts"),
         description: translate("pages.agent-details.stats.drafts-description"),
         value: data.totalDraft.toString(),
      };

      const published = {
         title: translate("pages.agent-details.stats.published"),
         description: translate(
            "pages.agent-details.stats.published-description",
         ),
         value: data.totalPublished.toString(),
      };

      const totalContentValue = (
         Number(data.totalDraft ?? 0) + Number(data.totalPublished ?? 0)
      ).toString();

      return [
         {
            label: translate("pages.agent-details.stats.total-content"),
            description: translate(
               "pages.agent-details.stats.total-content-description",
            ),
            value: totalContentValue,
            details: [drafts, published],
         },
         {
            label: translate("pages.agent-details.stats.total-words"),
            description: translate(
               "pages.agent-details.stats.total-words-description",
            ),
            value: data.wordsWritten?.toLocaleString() ?? "0",
         },
         {
            label: translate("pages.agent-details.stats.avg-quality-score"),
            description: translate(
               "pages.agent-details.stats.avg-quality-score-description",
            ),
            value: data.avgQualityScore?.toFixed(2).toString() ?? "0",
         },
         {
            label: translate("pages.agent-details.stats.total-ideas"),
            description: translate(
               "pages.agent-details.stats.total-ideas-description",
            ),
            value: data.totalIdeas?.toString() ?? "0",
         },
      ];
   }, [data]);

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
