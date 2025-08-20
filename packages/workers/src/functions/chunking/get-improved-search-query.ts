import { generateOpenRouterObject } from "@packages/openrouter/helpers";
import {
   tavilyQueryOptimizationPrompt,
   tavilyQueryOptimizationSchema,
   type TavilyQueryOptimizationSchema,
   tavilyQueryOptimizationSystemPrompt,
} from "@packages/prompts/prompt/search/search-query-creation";
import { createOpenrouterClient } from "@packages/openrouter/client";
import { serverEnv } from "@packages/environment/server";
import { enqueueBillingLlmIngestionJob } from "../../queues/billing-llm-ingestion-queue";
const openrouter = createOpenrouterClient(serverEnv.OPENROUTER_API_KEY);
export async function runGetImprovedSearchQuery(payload: {
   inputText: string;
   userId: string;
}) {
   const { inputText, userId } = payload;
   try {
      const searchQueryCreationResult = await generateOpenRouterObject(
         openrouter,
         {
            model: "small",
         },
         tavilyQueryOptimizationSchema,
         {
            system: tavilyQueryOptimizationSystemPrompt(),
            prompt: tavilyQueryOptimizationPrompt(inputText),
         },
      );
      await enqueueBillingLlmIngestionJob({
         inputTokens: searchQueryCreationResult.usage.inputTokens,
         outputTokens: searchQueryCreationResult.usage.outputTokens,
         effort: "small",
         userId,
      });
      const { optimizedQuery } =
         searchQueryCreationResult.object as TavilyQueryOptimizationSchema;

      return {
         optimizedQuery,
      };
   } catch (error) {
      console.error("Error during text chunking:", error);
      throw error;
   }
}
