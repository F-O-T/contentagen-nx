import { task, logger } from "@trigger.dev/sdk/v3";
import { brandDocumentChunkingPrompt } from "@packages/prompts/prompt/text/document-chunking";
import { generateOpenRouterText } from "@packages/openrouter/helpers";
import { createOpenrouterClient } from "@packages/openrouter/client";
import { serverEnv } from "@packages/environment/server";
const openrouter = createOpenrouterClient(serverEnv.OPENROUTER_API_KEY);
async function runChunkBrandDocument(payload: { inputText: string }) {
   const { inputText } = payload;
   try {
      logger.info("Starting brand document chunking", {
         inputLength: inputText.length,
      });
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
      const chunks = chunkingResult.text
         .split(/---CHUNK---/)
         .map((c) => c.trim())
         .filter(Boolean);
      logger.info("Chunking complete", {
         chunkCount: chunks.length,
         chunksPreview: chunks.map((c) => c.slice(0, 60)), // Preview up to 3 chunks, 60 chars each
         totalChars: chunks.reduce((sum, c) => sum + c.length, 0),
      });
      return {
         chunks,
      };
   } catch (error) {
      logger.error("Error during brand document chunking", {
         error: error instanceof Error ? error.message : error,
         stack: error instanceof Error && error.stack ? error.stack : undefined,
      });
      throw error;
   }
}

export const chunkBrandDocumentTask = task({
   id: "chunk-brand-document-job",
   run: runChunkBrandDocument,
});
