import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { Calendar } from "lucide-react";
import { InfoItem } from "@packages/ui/components/info-item";
import { AgentWriterCard } from "@/widgets/agent-display-card/ui/agent-writter-card";
import type { RouterOutput } from "@packages/api/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/integrations/clients";
interface CompetitorInfoCardProps {
   competitor: RouterOutput["competitor"]["list"]["items"][number];
}

export function CompetitorInfoCard({ competitor }: CompetitorInfoCardProps) {
   const formatDate = (date: Date) => {
      return new Intl.DateTimeFormat("en-US", {
         year: "numeric",
         month: "long",
         day: "numeric",
      }).format(date);
   };
   const trpc = useTRPC();
   const { data } = useSuspenseQuery(
      trpc.competitorFile.getLogo.queryOptions({
         competitorId: competitor.id,
      }),
   );
   return (
      <Card>
         <CardHeader>
            <CardTitle>Your competitor details</CardTitle>
            <CardDescription>
               All the details about your competitor
            </CardDescription>
         </CardHeader>
         <CardContent className="space-y-2">
            <AgentWriterCard
               name={competitor.name || ""}
               description={competitor.description || ""}
               photo={data?.data || ""}
            />
            <div className="grid grid-cols-2 gap-2">
               <InfoItem
                  icon={<Calendar className="h-4 w-4" />}
                  label="Added on"
                  value={formatDate(new Date(competitor.createdAt))}
               />

               <InfoItem
                  icon={<Calendar className="h-4 w-4" />}
                  label="Last updated"
                  value={formatDate(new Date(competitor.updatedAt))}
               />
            </div>
         </CardContent>
      </Card>
   );
}
