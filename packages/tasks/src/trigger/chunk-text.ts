import { task, logger } from "@trigger.dev/sdk/v3";
import { chunkingPrompt } from "@packages/prompts/prompt/text/chunking";
import { generateOpenRouterText } from "@packages/openrouter/helpers";
import { createOpenrouterClient } from "@packages/openrouter/client";
import { serverEnv } from "@packages/environment/server";
const openrouter = createOpenrouterClient(serverEnv.OPENROUTER_API_KEY);
export async function runChunkText(payload: { inputText: string }) {
   const { inputText } = payload;
   try {
      logger.info("Chunking input text", { inputLength: inputText.length });
      const chunkingResult = await generateOpenRouterText(openrouter, {
         system: chunkingPrompt(),
         prompt: inputText,
      });
      const chunks = chunkingResult.text
         .split(/---CHUNK---/)
         .map((c) => c.trim())
         .filter(Boolean);
      logger.info("Chunking complete", {
         chunkCount: chunks.length,
         chunksPreview: chunks,
      });
      return {
         chunks,
      };
   } catch (error) {
      logger.error("Error in text chunking task", {
         error: error instanceof Error ? error.message : error,
      });
      throw error;
   }
}

export const chunkTextTask = task({
   id: "chunk-text-job",
   run: runChunkText,
});
