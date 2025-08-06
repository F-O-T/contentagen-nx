import { chunkingPrompt } from "@packages/prompts/prompt/text/chunking";
import { generateOpenRouterText } from "@packages/openrouter/helpers";
import { createOpenrouterClient } from "@packages/openrouter/client";
import { serverEnv } from "@packages/environment/server";
const openrouter = createOpenrouterClient(serverEnv.OPENROUTER_API_KEY);
export async function runChunkText(payload: { inputText: string }) {
   const { inputText } = payload;
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
