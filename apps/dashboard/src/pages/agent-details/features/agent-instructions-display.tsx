import { Markdown } from "@packages/ui/components/markdown";
import { translate, type TranslationKey } from "@packages/localization";
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import {
   Tabs,
   TabsList,
   TabsTrigger,
   TabsContent,
} from "@packages/ui/components/tabs";
import type { PersonaConfig } from "@packages/database/schemas/agent";
import { useMemo } from "react";

interface AgentInstructionsDisplayProps {
   personaConfig: PersonaConfig;
}

interface InstructionCard {
   titleKey: TranslationKey;
   descriptionKey: TranslationKey;
   placeholderKey: TranslationKey;
   value: string | undefined;
}

export function AgentInstructionsDisplay({
   personaConfig,
}: AgentInstructionsDisplayProps) {
   const cards = useMemo(() => {
      const instructions = personaConfig.instructions;

      return [
         {
            titleKey: "pages.agent-details.instructions.tabs.audience.title",
            descriptionKey:
               "pages.agent-details.instructions.tabs.audience.description",
            placeholderKey:
               "pages.agent-details.instructions.tabs.audience.placeholder",
            value: instructions?.audienceProfile,
         },
         {
            titleKey: "pages.agent-details.instructions.tabs.writing.title",
            descriptionKey:
               "pages.agent-details.instructions.tabs.writing.description",
            placeholderKey:
               "pages.agent-details.instructions.tabs.writing.placeholder",
            value: instructions?.writingGuidelines,
         },
         {
            titleKey: "pages.agent-details.instructions.tabs.rag.title",
            descriptionKey:
               "pages.agent-details.instructions.tabs.rag.description",
            placeholderKey:
               "pages.agent-details.instructions.tabs.rag.placeholder",
            value: instructions?.ragIntegration,
         },
      ] as InstructionCard[];
   }, [personaConfig]);

   return (
      <Tabs defaultValue={cards[0]?.titleKey}>
         <Card>
            <CardHeader className="">
               <TabsList className="w-full">
                  {cards.map((card) => (
                     <TabsTrigger key={card.titleKey} value={card.titleKey}>
                        {translate(card.titleKey)}
                     </TabsTrigger>
                  ))}
               </TabsList>
            </CardHeader>
            <CardContent>
               {cards.map((card) => (
                  <TabsContent key={card.titleKey} value={card.titleKey}>
                     <div className="space-y-4">
                        <Markdown
                           content={
                              card.value || translate(card.placeholderKey)
                           }
                        />
                     </div>
                  </TabsContent>
               ))}
            </CardContent>
         </Card>
      </Tabs>
   );
}
