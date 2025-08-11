import { distillationPrompt } from "@packages/prompts/prompt/knowledge/distillation";
import { generateOpenRouterText } from "@packages/openrouter/helpers";
import { createOpenrouterClient } from "@packages/openrouter/client";
import { serverEnv } from "@packages/environment/server";
import { runIngestBilling } from "./ingest-usage";
import { createAiUsageMetadata } from "@packages/payment/ingestion";
const openrouter = createOpenrouterClient(serverEnv.OPENROUTER_API_KEY);
export async function runChunkDistillation(payload: {
   chunk: string;
   userId: string;
}) {
   const { chunk, userId } = payload;
   try {
      const result = await generateOpenRouterText(
         openrouter,
         {
            model: "small",
            reasoning: "high",
         },
         {
            prompt: chunk,
            system: distillationPrompt(),
         },
      );

      if (!result.usage.inputTokens || !result.usage.outputTokens) {
         console.error(
            "[runChunkBrandDocument] ERROR: No tokens used in chunking",
         );
         throw new Error("No tokens used in chunking");
      }
      await runIngestBilling({
         params: {
            metadata: createAiUsageMetadata({
               effort: "small",
               inputTokens: result.usage.inputTokens,
               outputTokens: result.usage.outputTokens,
            }),
            event: "LLM",
            externalCustomerId: userId, // This is a system-level operation, not user-specific
         },
      });
      const distilledChunk = result.text.trim();
      return {
         distilledChunk,
      };
   } catch (error) {
      console.error("Error during chunk distillation:", error);
      throw error;
   }
}
