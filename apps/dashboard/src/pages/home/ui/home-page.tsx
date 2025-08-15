import { useMemo } from "react";
import { Bot, FileText } from "lucide-react";
import {
   Card,
   CardHeader,
   CardTitle,
   CardDescription,
   CardContent,
} from "@packages/ui/components/card";
import { SquaredIconButton } from "@packages/ui/components/squared-icon-button";
import { Link } from "@tanstack/react-router";
import { useTRPC } from "@/integrations/clients";
import { useSuspenseQuery } from "@tanstack/react-query";

export function DashboardHomePage() {
   const trpc = useTRPC();
   const { data } = useSuspenseQuery(
      trpc.sessionHelper.getHomeStats.queryOptions(),
   );

   const statsCards = useMemo(
      () => [
         {
            title: "Total Agents",
            description: "Active agents registered",
            value: data.totalAgents,
         },
         {
            title: "Words Written (30d)",
            description: "Words generated in last 30 days",
            value: data.wordCount30d,
         },
         {
            title: "Content Generated (30d)",
            description: "Pieces of content generated",
            value: data.contentGenerated,
         },
      ],
      [data],
   );

   return (
      <div className="flex flex-col gap-4">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {statsCards.map((card) => (
               <Card className="col-span-1" key={card.title}>
                  <CardHeader>
                     <CardTitle>{card.title}</CardTitle>
                     <CardDescription>{card.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="font-bold text-4xl">
                     {card.value}
                  </CardContent>
               </Card>
            ))}
         </div>
         <div className="grid grid-cols-2 gap-4">
            <Link to="/agents">
               <SquaredIconButton>
                  <Bot className="w-5 h-5 " />
                  Agents
               </SquaredIconButton>
            </Link>
            <Link to="/content">
               <SquaredIconButton>
                  <FileText className="w-5 h-5" />
                  Content
               </SquaredIconButton>
            </Link>
         </div>
      </div>
   );
}
