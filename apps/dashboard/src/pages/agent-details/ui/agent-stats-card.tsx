// apps/dashboard/src/pages/agent-details/ui/agent-stats-card.tsx

import {
   Card,
   CardHeader,
   CardTitle,
   CardContent,
   CardDescription,
} from "@packages/ui/components/card";
import { useMemo } from "react";
import { InfoItem } from "@packages/ui/components/info-item";
import { FileEdit, CheckCircle2, Type, Star } from "lucide-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/integrations/clients";
import { useParams } from "@tanstack/react-router";

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
   const items = useMemo(
      () => [
         {
            label: "Drafts",
            value: data.totalDraft.toString(),
            icon: <FileEdit className="w-4 h-4" />,
         },
         {
            label: "Published",
            value: data.totalPublished.toString(),
            icon: <CheckCircle2 className="w-4 h-4" />,
         },
         {
            label: "Total Words Written",
            value: data.wordsWritten?.toString() ?? "0",
            icon: <Type className="w-4 h-4" />,
         },
         {
            label: "Avg. Quality Score",
            value: data.avgQualityScore?.toFixed(2).toString() ?? "0",
            icon: <Star className="w-4 h-4" />,
         },
      ],
      [data],
   );

   return (
      <Card>
         <CardHeader>
            <CardTitle>Agent Stats</CardTitle>
            <CardDescription>
               Overview of agent’s drafts and published content
            </CardDescription>
         </CardHeader>
         <CardContent className="grid gap-2 grid-cols-2">
            {items.map(({ label, value, icon }) => (
               <InfoItem icon={icon} key={label} label={label} value={value} />
            ))}
         </CardContent>
      </Card>
   );
}
