import {
   Card,
   CardHeader,
   CardTitle,
   CardDescription,
   CardContent,
   CardFooter,
} from "@packages/ui/components/card";

import { Bot, FileText, Megaphone, Users, Type } from "lucide-react";
import { useMemo } from "react";
import { InfoItem } from "@packages/ui/components/info-item";
import { Separator } from "@packages/ui/components/separator";
import { AgentWriterCard } from "@/widgets/agent-display-card/ui/agent-writter-card";
import type { AgentSelect } from "@packages/database/schema";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/integrations/clients";
import { formatValueForDisplay } from "@packages/helpers/text";

export const AgentPersonaCard = ({ agent }: { agent: AgentSelect }) => {
   const trpc = useTRPC();
   const { data } = useSuspenseQuery(
      trpc.agentFile.getProfilePhoto.queryOptions({
         agentId: agent.id,
      }),
   );
   const items = useMemo(
      () => [
         {
            label: "Content Type",
            value: formatValueForDisplay(agent.personaConfig?.purpose ?? ""),
            icon: FileText,
         },
         {
            label: "Voice Tone",
            value: formatValueForDisplay(
               agent.personaConfig?.voice?.communication ?? "",
            ),
            icon: Megaphone,
         },
         {
            label: "Target Audience",
            value: formatValueForDisplay(
               agent.personaConfig?.audience?.base ?? "",
            ),
            icon: Users,
         },
         {
            label: "Formatting Style",
            value: formatValueForDisplay(
               agent.personaConfig?.formatting?.style ?? "",
            ),
            icon: Type,
         },
         {
            label: "Language",
            value: formatValueForDisplay(
               agent.personaConfig?.language?.primary ?? "",
            ),
            icon: Type,
         },
         {
            label: "Brand Integration",
            value: formatValueForDisplay(
               agent.personaConfig?.brand?.integrationStyle ?? "",
            ),
            icon: Bot,
         },
      ],
      [agent],
   );

   return (
      <Card>
         <CardHeader>
            <CardTitle className="line-clamp-1">Agent Persona</CardTitle>
            <CardDescription className="line-clamp-1">
               Configuration summary
            </CardDescription>
         </CardHeader>
         <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map(({ label, value, icon: Icon }) => (
               <InfoItem
                  key={label}
                  label={label}
                  value={value}
                  icon={<Icon className="w-4 h-4" />}
               />
            ))}
         </CardContent>
         <CardFooter className="grid gap-2">
            <Separator />
            <AgentWriterCard
               name={agent.personaConfig?.metadata.name}
               description={agent.personaConfig?.metadata.description}
               photo={data?.data}
            />
         </CardFooter>
      </Card>
   );
};
