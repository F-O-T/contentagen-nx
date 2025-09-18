import { StatsCard } from "@packages/ui/components/stats-card";
import { useTRPC } from "@/integrations/clients";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo } from "react";

export function OrganizationStatsCard() {
   const trpc = useTRPC();
   const { data: org } = useSuspenseQuery(
      trpc.authHelpers.getDefaultOrganization.queryOptions(),
   );

   const items = useMemo(() => {
      const memberCount = org?.members?.length || 0;
      const agentCount = org?.agents?.length || 0;

      const membersDetails = [
         {
            title: "Active Members",
            description: "Currently active organization members",
            value: memberCount.toString(),
         },
      ];

      const agentsDetails = [
         {
            title: "Active Agents",
            description: "Currently active agents",
            value: agentCount.toString(),
         },
      ];

      return [
         {
            label: "Total Members",
            description: "Total members in your organization",
            value: memberCount.toString(),
            details: membersDetails,
         },
         {
            label: "Total Agents",
            description: "Total agents created in your organization",
            value: agentCount.toString(),
            details: agentsDetails,
         },
         {
            label: "Organization Age",
            description: "Time since organization creation",
            value: org?.createdAt 
               ? `${Math.floor((Date.now() - new Date(org.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days`
               : "0 days",
         },
         {
            label: "Brand Knowledge Status",
            description: "Status of brand knowledge processing",
            value: org?.brandKnowledgeStatus || "pending",
         },
      ];
   }, [org]);

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