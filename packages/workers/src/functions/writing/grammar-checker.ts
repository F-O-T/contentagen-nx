import { generateOpenRouterObject } from "@packages/openrouter/helpers";
import { createOpenrouterClient } from "@packages/openrouter/client";
import { serverEnv } from "@packages/environment/server";
import {
   languageCorrectionInputPrompt,
   languageCorrectionSchema,
   type LanguageCorrectionSchema,
   ideaGrammarCorrectionSchema,
   type IdeaGrammarCorrectionSchema,
} from "@packages/prompts/prompt/language/language-corrections";
import { enqueueBillingLlmIngestionJob } from "../../queues/billing-llm-ingestion-queue";
import { createLanguageSection } from "@packages/prompts/helpers/assemble-writing-prompt";
import type { PersonaConfig } from "@packages/database/schema";
const openrouter = createOpenrouterClient(serverEnv.OPENROUTER_API_KEY);
export async function runGrammarChecker(payload: {
   text: string;
   userId: string;
   personaConfig: PersonaConfig;
}) {
   const { text, userId, personaConfig } = payload;
   try {
      const language = `${personaConfig.language?.primary} - ${personaConfig.language?.variant}`;
      const result = await generateOpenRouterObject(
         openrouter,
         {
            model: "small",
         },
         languageCorrectionSchema,
         {
            system: createLanguageSection(personaConfig, true),
            prompt: languageCorrectionInputPrompt(text, language),
         },
      );

      await enqueueBillingLlmIngestionJob({
         inputTokens: result.usage.inputTokens,
         outputTokens: result.usage.outputTokens,
         effort: "small",
         userId,
      });

      const { correctedDraft } = result.object as LanguageCorrectionSchema;
      return {
         correctedDraft,
      };
   } catch (error) {
      console.error("Error during chunk distillation:", error);
      throw error;
   }
}

export async function runIdeaGrammarChecker(payload: {
   idea: { title: string; description: string };
   userId: string;
   personaConfig: PersonaConfig;
}) {
   const { idea, userId, personaConfig } = payload;
   try {
      const language = `${personaConfig.language?.primary} - ${personaConfig.language?.variant}`;

      // Create a combined text for grammar checking that includes both title and description
      const combinedText = `Title: ${idea.title}\n\nDescription: ${idea.description}`;

      const result = await generateOpenRouterObject(
         openrouter,
         {
            model: "small",
         },
         ideaGrammarCorrectionSchema,
         {
            system: createLanguageSection(personaConfig, true),
            prompt: `Please correct the grammar and improve the language for this blog post idea. Focus on both the title and description separately, maintaining their distinct purposes while ensuring linguistic excellence.

${combinedText}

Target Language: ${language}

Return a JSON object with corrected title and description, following the exact schema format.`,
         },
      );

      await enqueueBillingLlmIngestionJob({
         inputTokens: result.usage.inputTokens,
         outputTokens: result.usage.outputTokens,
         effort: "small",
         userId,
      });

      const correctionResult = result.object as IdeaGrammarCorrectionSchema;
      return {
         correctedIdea: {
            title: correctionResult.title.correctedDraft,
            description: correctionResult.description.correctedDraft,
         },
         corrections: {
            title: correctionResult.title.corrections || [],
            description: correctionResult.description.corrections || [],
         },
         qualityScores: {
            title: correctionResult.title.qualityScore || 0,
            description: correctionResult.description.qualityScore || 0,
         },
      };
   } catch (error) {
      console.error("Error during idea grammar correction:", error);
      throw error;
   }
}
