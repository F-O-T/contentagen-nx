import {
   Card,
   CardHeader,
   CardTitle,
   CardDescription,
   CardContent,
} from "@packages/ui/components/card";

import { Bot, FileText, Megaphone, Users, Type } from "lucide-react";
import type React from "react";
import { useMemo } from "react";
import { InfoItem } from "@packages/ui/components/info-item";
import { Separator } from "@packages/ui/components/separator";

interface AgentPersonaCardProps {
   name: string;
   description: string;
   contentType: string;
   voiceTone: string;
   targetAudience: string;
   formattingStyle: string;
}

function formatValue(value: string) {
   return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export const AgentPersonaCard: React.FC<AgentPersonaCardProps> = ({
   name,
   description,
   contentType,
   voiceTone,
   targetAudience,
   formattingStyle,
}) => {
   const items = useMemo(
      () => [
         {
            label: "Content Type",
            value: formatValue(contentType),
            icon: FileText,
         },
         {
            label: "Voice Tone",
            value: formatValue(voiceTone),
            icon: Megaphone,
         },
         {
            label: "Target Audience",
            value: formatValue(targetAudience),
            icon: Users,
         },
         {
            label: "Formatting Style",
            value: formatValue(formattingStyle),
            icon: Type,
         },
      ],
      [contentType, voiceTone, targetAudience, formattingStyle],
   );

   return (
      <Card>
         <CardHeader>
            <CardTitle>Agent Persona</CardTitle>
            <CardDescription>Configuration summary</CardDescription>
         </CardHeader>
         <CardContent className="flex flex-col gap-4">
            <div className="flex items-center gap-4 rounded-lg bg-muted p-4 ">
               <Bot className="w-8 h-8 rounded-full bg-muted" />
               <div>
                  <p className="font-medium text-sm">{name}</p>
                  <p className="text-xs text-muted-foreground">{description}</p>
               </div>
            </div>
            <Separator />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {items.map(({ label, value, icon: Icon }) => (
                  <InfoItem
                     key={label}
                     label={label}
                     value={value}
                     icon={<Icon className="w-4 h-4" />}
                  />
               ))}
            </div>
         </CardContent>
      </Card>
   );
};
