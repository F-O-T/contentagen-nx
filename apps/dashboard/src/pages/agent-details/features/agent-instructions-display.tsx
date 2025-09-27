import { Markdown } from "@packages/ui/components/markdown";
import { translate, type TranslationKey } from "@packages/localization";
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import type { PersonaConfig } from "@packages/database/schemas/agent";
import { useMemo } from "react";

interface AgentInstructionsDisplayProps {
   personaConfig: PersonaConfig;
   onEdit: () => void;
}

interface InstructionCard {
   titleKey: TranslationKey;
   descriptionKey: TranslationKey;
   placeholderKey: TranslationKey;
   value: string | undefined;
}

export function AgentInstructionsDisplay({
   personaConfig,
   onEdit,
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         {cards.map((card) => (
            <Card key={card.titleKey} className="h-full">
               <CardHeader>
                  <CardTitle>{translate(card.titleKey)}</CardTitle>
                  <CardDescription>
                     {translate(card.descriptionKey)}
                  </CardDescription>
               </CardHeader>
               <CardContent className="h-full">
                  <Markdown
                     content={card.value || translate(card.placeholderKey)}
                  />
               </CardContent>
            </Card>
         ))}
      </div>
   );
}
