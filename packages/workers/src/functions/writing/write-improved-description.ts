import {
   descriptionImprovementSchema,
   descriptionImproverInputPrompt,
   descriptionImproverPrompt,
   type DescriptionImprovementSchema,
} from "@packages/prompts/prompt/writing/description-improver";
import { generateOpenRouterObject } from "@packages/openrouter/helpers";
import { createOpenrouterClient } from "@packages/openrouter/client";
import { serverEnv } from "@packages/environment/server";
import { addBillingLlmIngestionJob } from "../../queues/billing-llm-ingestion-queue";
const openrouter = createOpenrouterClient(serverEnv.OPENROUTER_API_KEY);
export async function runWriteImprovedDescription(payload: {
   description: string;
   chunks: string[];
   userId: string;
}) {
   const { chunks, description, userId } = payload;
   try {
      const result = await generateOpenRouterObject(
         openrouter,
         {
            model: "small",
         },
         descriptionImprovementSchema,
         {
            prompt: descriptionImproverInputPrompt(description, chunks),
            system: descriptionImproverPrompt(),
         },
      );

      await addBillingLlmIngestionJob({
         inputTokens: result.usage.inputTokens,
         outputTokens: result.usage.outputTokens,
         effort: "small",
         userId,
      });

      const { brandIntegrationDocumentation } =
         result.object as DescriptionImprovementSchema;
      return {
         brandIntegrationDocumentation,
      };
   } catch (error) {
      console.error("Error during chunk distillation:", error);
      throw error;
   }
}
