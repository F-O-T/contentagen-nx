import { task, logger } from "@trigger.dev/sdk/v3";
import { formattingPrompt } from "@packages/prompts/prompt/task/formatting";
import { generateOpenRouterText } from "@packages/openrouter/helpers";
import { createOpenrouterClient } from "@packages/openrouter/client";
import { serverEnv } from "@packages/environment/server";
const openrouter = createOpenrouterClient(serverEnv.OPENROUTER_API_KEY);
async function runChunkDistillation(payload: { chunk: string }) {
   const { chunk } = payload;
   try {
      logger.info("Distilling chunk", {
         chunkLength: chunk.length,
      });
      const result = await generateOpenRouterText(openrouter, {
         prompt: chunk,
         system: formattingPrompt(),
      });
      logger.info("Formatted chunk", {
         distilledTextLength: result.text.length,
         resultText: result.text,
      });

      const distilledChunk = result.text.trim();
      return {
         distilledChunk,
      };
   } catch (error) {
      logger.error("Error in chunk distillation task", {
         error: error instanceof Error ? error.message : error,
      });
      throw error;
   }
}

export const chunkDistillationTask = task({
   id: "chunk-distillation-job",
   run: runChunkDistillation,
});
