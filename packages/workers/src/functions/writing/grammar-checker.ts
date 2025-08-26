import { generateOpenRouterObject } from "@packages/openrouter/helpers";
import { createOpenrouterClient } from "@packages/openrouter/client";
import { serverEnv } from "@packages/environment/server";
import {
   languageCorrectionInputPrompt,
   languageCorrectionSchema,
   type LanguageCorrectionSchema,
} from "@packages/prompts/prompt/language/base";
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
            system: createLanguageSection(personaConfig),
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
