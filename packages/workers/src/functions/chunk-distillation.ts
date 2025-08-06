import { distillationPrompt } from "@packages/prompts/prompt/knowledge/distillation";
import { generateOpenRouterText } from "@packages/openrouter/helpers";
import { createOpenrouterClient } from "@packages/openrouter/client";
import { serverEnv } from "@packages/environment/server";
const openrouter = createOpenrouterClient(serverEnv.OPENROUTER_API_KEY);
export async function runChunkDistillation(payload: { chunk: string }) {
   const { chunk } = payload;
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

      const distilledChunk = result.text.trim();
      return {
         distilledChunk,
      };
   } catch (error) {
      console.error("Error during chunk distillation:", error);
      throw error;
   }
}
