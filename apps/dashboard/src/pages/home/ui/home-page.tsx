import { useMemo } from "react";
import { translate } from "@packages/localization";
import { Bot, FileText } from "lucide-react";
import { StatsCard } from "@packages/ui/components/stats-card";
import { SquaredIconButton } from "@packages/ui/components/squared-icon-button";
import { Link } from "@tanstack/react-router";
import { useTRPC } from "@/integrations/clients";
import { useSuspenseQuery } from "@tanstack/react-query";

export function DashboardHomePage() {
   const trpc = useTRPC();
   const { data } = useSuspenseQuery(
      trpc.authHelpers.getHomeStats.queryOptions(),
   );

   const statsCards = useMemo(
      () => [
         {
            title: translate(
               "pages.home.stats-cards.agent-stats.title",
            ),
            description: translate(
               "pages.home.stats-cards.agent-stats.description",
            ),
            value: data.totalAgents,
         },
         {
            title: translate(
               "pages.home.stats-cards.words-written.title",
            ),
            description: translate(
               "pages.home.stats-cards.words-written.description",
            ),
            value: data.wordCount30d?.toLocaleString() ?? "0",
         },
         {
            title: translate("pages.home.stats-cards.content-generated.title"),
            description: translate(
               "pages.home.stats-cards.content-generated.description",
            ),
            value: data.contentGenerated,
         },
      ],
      [data],
   );

   return (
      <div className="flex flex-col gap-4">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {statsCards.map((card) => (
               <StatsCard
                  key={card.title}
                  title={card.title}
                  description={card.description}
                  value={card.value}
               />
            ))}
         </div>
         <div className="grid grid-cols-2 gap-4">
            <Link to="/agents">
               <SquaredIconButton>
                  <Bot className="w-5 h-5 " />
                  Agents
               </SquaredIconButton>
            </Link>
            <Link to="/content" search={{ page: 1 }}>
               <SquaredIconButton>
                  <FileText className="w-5 h-5" />
                  Content
               </SquaredIconButton>
            </Link>
         </div>
      </div>
   );
}
