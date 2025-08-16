import { chunkingPrompt } from "@packages/prompts/prompt/text/chunking";
import { generateOpenRouterText } from "@packages/openrouter/helpers";
import { createOpenrouterClient } from "@packages/openrouter/client";
import { serverEnv } from "@packages/environment/server";
import { billingLlmIngestionQueue } from "../queues/billing-llm-ingestion-queue";
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
      await billingLlmIngestionQueue.add("chunk-distillation", {
         inputTokens: chunkingResult.usage.inputTokens,
         outputTokens: chunkingResult.usage.outputTokens,
         effort: "small",
         userId, // This is a system-level operation, not user-specific
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
