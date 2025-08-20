import {
   brandAnalysisSchema,
   type BrandAnalysisSchema,
   documentIntelligenceInputPrompt,
   documentIntelligencePrompt,
} from "@packages/prompts/prompt/writing/brand-overview";
import { generateOpenRouterObject } from "@packages/openrouter/helpers";
import { createOpenrouterClient } from "@packages/openrouter/client";
import { serverEnv } from "@packages/environment/server";
import { enqueueBillingLlmIngestionJob } from "../../queues/billing-llm-ingestion-queue";
const openrouter = createOpenrouterClient(serverEnv.OPENROUTER_API_KEY);
export async function runWriteBrandIntegrationDocument(payload: {
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
         brandAnalysisSchema,
         {
            prompt: documentIntelligenceInputPrompt(websiteData),
            system: documentIntelligencePrompt(),
         },
      );

      await enqueueBillingLlmIngestionJob({
         inputTokens: result.usage.inputTokens,
         outputTokens: result.usage.outputTokens,
         effort: "small",
         userId,
      });

      const { fullBrandAnalysis } = result.object as BrandAnalysisSchema;
      return {
         fullBrandAnalysis,
      };
   } catch (error) {
      console.error("Error during chunk distillation:", error);
      throw error;
   }
}
