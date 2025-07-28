import { task } from "@trigger.dev/sdk/v3";
import {
   getChunkingPrompt,
   getDistillationPrompt,
   getFormattingPrompt,
} from "@packages/prompts/helpers/knowledge-distillation-helper";
import { generateOpenRouterText } from "@packages/openrouter/helpers";
import type { OpenRouterClient } from "@packages/openrouter/client";

export const distillationTask = task({
   id: "distillation-job",
   run: async (payload: {
      inputText: string;
      openrouter: OpenRouterClient;
   }) => {
      const { inputText, openrouter } = payload;

      // 1. Chunking
      const chunkingPrompt = getChunkingPrompt().replace(
         "[INSERT YOUR TEXT HERE]",
         inputText,
      );
      const chunkingResult = await generateOpenRouterText(openrouter, {
         prompt: chunkingPrompt,
      });
      const chunks = chunkingResult.text
         .split(/---CHUNK---/)
         .map((c) => c.trim())
         .filter(Boolean);

      // 2. Distillation
      const distillationPrompt = getDistillationPrompt();
      const distilledChunks: string[] = [];
      for (const chunk of chunks) {
         const prompt = distillationPrompt.replace(
            "[INSERT CHUNK HERE]",
            chunk,
         );
         const result = await generateOpenRouterText(openrouter, { prompt });
         distilledChunks.push(result.text.trim());
      }

      // 3. Formatting (combine all distilled chunks)
      const formattingPrompt = getFormattingPrompt().replace(
         "[INSERT CHUNK HERE]",
         distilledChunks.join("\n\n"),
      );
      const formattingResult = await generateOpenRouterText(openrouter, {
         prompt: formattingPrompt,
      });

      return {
         formatted: formattingResult.text.trim(),
         distilledChunks,
         chunks,
      };
   },
});
