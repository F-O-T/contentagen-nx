import { chunkingPrompt } from "@packages/prompts/prompt/text/chunking";
import { generateOpenRouterText } from "@packages/openrouter/helpers";
import { createOpenrouterClient } from "@packages/openrouter/client";
import { serverEnv } from "@packages/environment/server";
import { runIngestBilling } from "./ingest-usage";
import { createAiUsageMetadata } from "@packages/payment/ingestion";
const openrouter = createOpenrouterClient(serverEnv.OPENROUTER_API_KEY);
export async function runChunkText(payload: {
   inputText: string;
   userId: string;
}) {
   const { inputText, userId } = payload;
   try {
      const chunkingResult = await generateOpenRouterText(
         openrouter,
         {
            model: "small",
         },
         {
            system: chunkingPrompt(),
            prompt: inputText,
         },
      );
      if (
         !chunkingResult.usage.inputTokens ||
         !chunkingResult.usage.outputTokens
      ) {
         console.error(
            "[runChunkBrandDocument] ERROR: No tokens used in chunking",
         );
         throw new Error("No tokens used in chunking");
      }
      await runIngestBilling({
         params: {
            metadata: createAiUsageMetadata({
               effort: "small",
               inputTokens: chunkingResult.usage.inputTokens,
               outputTokens: chunkingResult.usage.outputTokens,
            }),
            event: "LLM",
            externalCustomerId: userId, // This is a system-level operation, not user-specific
         },
      });

      const chunks = chunkingResult.text
         .split(/---CHUNK---/)
         .map((c) => c.trim())
         .filter(Boolean);
      return {
         chunks,
      };
   } catch (error) {
      console.error("Error during text chunking:", error);
      throw error;
   }
}
