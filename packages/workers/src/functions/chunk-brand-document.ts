import { brandDocumentChunkingPrompt } from "@packages/prompts/prompt/text/document-chunking";
import { generateOpenRouterText } from "@packages/openrouter/helpers";
import { createOpenrouterClient } from "@packages/openrouter/client";
import { serverEnv } from "@packages/environment/server";
import { billingLlmIngestionQueue } from "../queues/billing-llm-ingestion-queue";
const openrouter = createOpenrouterClient(serverEnv.OPENROUTER_API_KEY);
export async function runChunkBrandDocument(payload: {
   inputText: string;
   userId: string;
}) {
   const { inputText, userId } = payload;
   console.log(
      `[runChunkBrandDocument] Chunking input (length: ${inputText.length})`,
   );
   const chunkingResult = await generateOpenRouterText(
      openrouter,
      {
         model: "small",
      },
      {
         system: brandDocumentChunkingPrompt(),
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
   await billingLlmIngestionQueue.add("brand-document", {
      inputTokens: chunkingResult.usage.inputTokens,
      outputTokens: chunkingResult.usage.outputTokens,
      effort: "small",
      userId, // This is a system-level operation, not user-specific
   });

   const chunks = chunkingResult.text
      .split(/---CHUNK---/)
      .map((c) => c.trim())
      .filter(Boolean);
   console.log(
      `[runChunkBrandDocument] Chunking complete. Chunks: ${chunks.length}`,
   );
   return {
      chunks,
   };
}
