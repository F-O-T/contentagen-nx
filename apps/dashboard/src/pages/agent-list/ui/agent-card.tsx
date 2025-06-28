import React from "react";
import {
   Card,
   CardHeader,
   CardTitle,
   CardContent,
   CardFooter,
   CardAction,
   CardDescription,
} from "@packages/ui/components/card";
import { InfoItem } from "@packages/ui/components/info-item";
import {
   DropdownMenu,
   DropdownMenuTrigger,
   DropdownMenuContent,
   DropdownMenuItem,
} from "@packages/ui/components/dropdown-menu";
import { Button } from "@packages/ui/components/button";
import { Link } from "@tanstack/react-router";
import {
   Edit,
   MoreVertical,
   Folder,
   Users,
   FileText,
   CheckCircle2,
} from "lucide-react";
import type { EdenClientType } from "@packages/eden";
import { formatValueToTitleCase } from "@packages/ui/lib/utils";

type Agent = NonNullable<
   Awaited<ReturnType<EdenClientType["api"]["v1"]["agents"]["get"]>>["data"]
>["agents"][number];

type AgentCardProps = {
   agent: Agent;
};

export function AgentCard({ agent }: AgentCardProps) {
   const infoItems = React.useMemo(
      () => [
         {
            icon: <Users />,
            label: "Voice & Audience",
            value: `${formatValueToTitleCase(agent.voiceTone)} • ${formatValueToTitleCase(agent.targetAudience)}`,
         },
      ],
      [agent],
   );

   const statsItems = React.useMemo(
      () => [
         {
            icon: <FileText />,
            label: "Drafts",
            value: String(agent.totalDrafts ?? 0),
         },
         {
            icon: <CheckCircle2 />,
            label: "Published",
            value: String(agent?.totalPublished ?? 0),
         },
      ],
      [agent],
   );

   return (
      <Card>
         <CardHeader>
            <CardTitle>{agent.name}</CardTitle>
            <CardDescription>{agent.description}</CardDescription>
            <CardAction>
               <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                     <Button size="icon" variant="ghost">
                        <MoreVertical className="w-5 h-5" />
                     </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                     <DropdownMenuItem asChild>
                        <Link search={{ id: agent.id }} to="/agents/edit">
                           <Edit className="w-4 h-4 mr-2" /> Edit
                        </Link>
                     </DropdownMenuItem>
                     <DropdownMenuItem>
                        <Folder className="w-4 h-4 mr-2" /> Delete
                     </DropdownMenuItem>
                  </DropdownMenuContent>
               </DropdownMenu>
            </CardAction>
         </CardHeader>

         <CardContent className="flex flex-col gap-2">
            {infoItems.map((item) => (
               <InfoItem
                  key={item.label}
                  icon={item.icon}
                  label={item.label}
                  value={item.value}
               />
            ))}
            <div className="flex gap-2">
               {statsItems.map((item) => (
                  <InfoItem
                     key={item.label}
                     icon={item.icon}
                     label={item.label}
                     value={item.value}
                  />
               ))}
            </div>
         </CardContent>

         <CardFooter className="">
            <Link to={`/agents`} className="flex-1">
               <Button className="w-full" size="sm" variant="outline">
                  Generate
               </Button>
            </Link>
         </CardFooter>
      </Card>
   );
}
