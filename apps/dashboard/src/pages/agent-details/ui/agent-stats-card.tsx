// apps/dashboard/src/pages/agent-details/ui/agent-stats-card.tsx

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@packages/ui/components/card";
import { useMemo } from "react";
import { InfoItem } from "@packages/ui/components/info-item";
import { FileText, Eye } from "lucide-react";

export interface AgentStatsCardProps {
  totalDrafts: number;
  totalPublished: number;
}

export function AgentStatsCard({ totalDrafts, totalPublished }: AgentStatsCardProps) {
  const items = useMemo(
    () => [
      { label: "Drafts", value: totalDrafts.toString() },
      { label: "Published", value: totalPublished.toString() },
    ],
    [totalDrafts, totalPublished]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agent Stats</CardTitle>
        <CardDescription>Overview of agent’s drafts and published content</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map(({ label, value }) => (
          <InfoItem
            icon={label === "Drafts" ? <FileText /> : <Eye />}
            key={label}
            label={label}
            value={value}
          />
        ))}
      </CardContent>
    </Card>
  );
}