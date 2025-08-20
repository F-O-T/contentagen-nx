import { generateOpenRouterObject } from "@packages/openrouter/helpers";
import { createOpenrouterClient } from "@packages/openrouter/client";
import { serverEnv } from "@packages/environment/server";
import {
   unifiedContentAnalysisInputPrompt,
   unifiedContentAnalysisPrompt,
   unifiedContentAnalysisSchema,
   type UnifiedContentAnalysis,
} from "@packages/prompts/prompt/post-processing/content-metadata";
import { addBillingLlmIngestionJob } from "../../helper-queues/billing-llm-ingestion-queue";

const openrouter = createOpenrouterClient(serverEnv.OPENROUTER_API_KEY);

export async function runAnalyzeContent(payload: {
   content: string;
   userId: string;
}) {
   const { content, userId } = payload;
   try {
      const result = await generateOpenRouterObject(
         openrouter,
         {
            model: "small",
         },
         unifiedContentAnalysisSchema,
         {
            system: unifiedContentAnalysisPrompt(),
            prompt: unifiedContentAnalysisInputPrompt(content),
         },
      );
      await addBillingLlmIngestionJob({
         inputTokens: result.usage.inputTokens,
         outputTokens: result.usage.outputTokens,
         effort: "small",
         userId,
      });

      const { description, qualityScore } =
         result.object as UnifiedContentAnalysis;
      return {
         description,
         qualityScore,
      };
   } catch (error) {
      console.error("Error during content analysis:", error);
      throw error;
   }
}
