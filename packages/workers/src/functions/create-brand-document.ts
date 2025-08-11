import { generateOpenRouterText } from "@packages/openrouter/helpers";
import { createOpenrouterClient } from "@packages/openrouter/client";
import { serverEnv } from "@packages/environment/server";
import { documentIntelligencePrompt } from "@packages/prompts/prompt/brand/document-intelligence";
import { runIngestBilling } from "./ingest-usage";
import { createAiUsageMetadata } from "@packages/payment/ingestion";

const openrouter = createOpenrouterClient(serverEnv.OPENROUTER_API_KEY);

export async function runCreateBrandDocument(payload: {
   rawText: string;
   userId: string;
}) {
   const { rawText, userId } = payload;
   try {
      console.log(
         `[runCreateBrandDocument] Creating brand document from raw text (length: ${rawText.length})`,
      );
      const model: { model: "small"; reasoning: "high" } = {
         model: "small",
         reasoning: "high",
      };
      const promptConfig = {
         system: documentIntelligencePrompt(),
         prompt: rawText,
      };
      const result = await generateOpenRouterText(
         openrouter,
         model,
         promptConfig,
      );
      if (!result.text || result.text.trim() === "") {
         console.error(
            "[runCreateBrandDocument] ERROR: Generated content is empty",
         );
         throw new Error("Generated content is empty");
      }
      if (!result.usage.totalTokens) {
         console.error(
            "[runCreateBrandDocument] ERROR: No tokens used in generation",
         );
         throw new Error("No tokens used in generation");
      }
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
      console.log(
         `[runCreateBrandDocument] Brand document generated (length: ${result.text.trim().length})`,
      );
      return { content: result.text.trim() };
   } catch (error) {
      console.error("[runCreateBrandDocument] Unhandled error:", error);
      throw error;
   }
}
