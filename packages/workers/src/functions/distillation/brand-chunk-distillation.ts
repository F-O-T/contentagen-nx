import {
   distillationInputPrompt,
   distillationPrompt,
   distillationSchema,
   type DistillationSchema,
} from "@packages/prompts/prompt/knowledge/distillation";
import { generateOpenRouterObject } from "@packages/openrouter/helpers";
import { createOpenrouterClient } from "@packages/openrouter/client";
import { serverEnv } from "@packages/environment/server";
import { addBillingLlmIngestionJob } from "../../helper-queues/billing-llm-ingestion-queue";
const openrouter = createOpenrouterClient(serverEnv.OPENROUTER_API_KEY);
export async function runChunksDistillation(payload: {
   chunks: string[];
   userId: string;
}) {
   const { chunks, userId } = payload;
   try {
      const result = await generateOpenRouterObject(
         openrouter,
         {
            model: "small",
            reasoning: "high",
         },
         distillationSchema,
         {
            prompt: distillationInputPrompt(chunks),
            system: distillationPrompt(),
         },
      );

      await addBillingLlmIngestionJob({
         inputTokens: result.usage.inputTokens,
         outputTokens: result.usage.outputTokens,
         effort: "small",
         userId,
      });

      const { distilledChunks } = result.object as DistillationSchema;
      return {
         distilledChunks,
      };
   } catch (error) {
      console.error("Error during chunk distillation:", error);
      throw error;
   }
}
