import {
   competitorFeatureSchema,
   type CompetitorFeatureSchema,
   competitorAnalysisPrompt,
   competitorAnalysisInputPrompt,
} from "@packages/prompts/prompt/analysis/competitor-features";
import { generateOpenRouterObject } from "@packages/openrouter/helpers";
import { createOpenrouterClient } from "@packages/openrouter/client";
import { serverEnv } from "@packages/environment/server";
import { enqueueBillingLlmIngestionJob } from "../../queues/billing-llm-ingestion-queue";

const openrouter = createOpenrouterClient(serverEnv.OPENROUTER_API_KEY);

export async function runAnalyzeCompetitorFeatures(payload: {
   websiteData: string;
   userId: string;
}) {
   const { websiteData, userId } = payload;
   try {
      const result = await generateOpenRouterObject(
         openrouter,
         {
            model: "small",
         },
         competitorFeatureSchema,
         {
            prompt: competitorAnalysisInputPrompt(websiteData),
            system: competitorAnalysisPrompt(),
         },
      );

      await enqueueBillingLlmIngestionJob({
         inputTokens: result.usage.inputTokens,
         outputTokens: result.usage.outputTokens,
         effort: "small",
         userId,
      });

      const { features } = result.object as CompetitorFeatureSchema;
      return {
         features,
      };
   } catch (error) {
      console.error("Error during competitor feature analysis:", error);
      throw error;
   }
}
