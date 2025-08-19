import { generateOpenRouterObject } from "@packages/openrouter/helpers";
import {
   keywordExtractionSystemPrompt,
   keywordExtractionPrompt,
   keywordExtractionSchema,
   type KeywordExtractionSchema,
} from "@packages/prompts/prompt/keywords/keyword-extractor";
import { createOpenrouterClient } from "@packages/openrouter/client";
import { serverEnv } from "@packages/environment/server";
import { addBillingLlmIngestionJob } from "../../helper-queues/billing-llm-ingestion-queue";
const openrouter = createOpenrouterClient(serverEnv.OPENROUTER_API_KEY);
export async function runGetContentKeywords(payload: {
   inputText: string;
   userId: string;
}) {
   const { inputText, userId } = payload;
   try {
      const headlineKeywordResult = await generateOpenRouterObject(
         openrouter,
         {
            model: "small",
         },
         keywordExtractionSchema,
         {
            system: keywordExtractionSystemPrompt(),
            prompt: keywordExtractionPrompt(inputText),
         },
      );
      await addBillingLlmIngestionJob({
         inputTokens: headlineKeywordResult.usage.inputTokens,
         outputTokens: headlineKeywordResult.usage.outputTokens,
         effort: "small",
         userId,
      });
      const { keywords } =
         headlineKeywordResult.object as KeywordExtractionSchema;

      return {
         keywords,
      };
   } catch (error) {
      console.error("Error during text chunking:", error);
      throw error;
   }
}
