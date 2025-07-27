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
import { FileText, Eye } from "lucide-react";

export interface AgentStatsCardProps {
   totalDrafts: number;
   totalPublished: number;
}

export function AgentStatsCard({
   totalDrafts,
   totalPublished,
}: AgentStatsCardProps) {
   const items = useMemo(
      () => [
         {
            label: "Drafts",
            value: totalDrafts.toString(),
            icon: <FileText className="w-4 h-4" />,
         },
         {
            label: "Published",
            value: totalPublished.toString(),
            icon: <Eye className="w-4 h-4" />,
         },
      ],
      [totalDrafts, totalPublished],
   );

   return (
      <Card>
         <CardHeader>
            <CardTitle>Agent Stats</CardTitle>
            <CardDescription>
               Overview of agent’s drafts and published content
            </CardDescription>
         </CardHeader>
         <CardContent className="grid gap-4 grid-cols-1 md:grid-cols-2">
            {items.map(({ label, value, icon }) => (
               <InfoItem icon={icon} key={label} label={label} value={value} />
            ))}
         </CardContent>
      </Card>
   );
}
