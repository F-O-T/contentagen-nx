// import { task } from "@trigger.dev/sdk/v3";
import { brandDocumentChunkingPrompt } from "@packages/prompts/prompt/text/document-chunking";
import { generateOpenRouterText } from "@packages/openrouter/helpers";
import { createOpenrouterClient } from "@packages/openrouter/client";
import { serverEnv } from "@packages/environment/server";
const openrouter = createOpenrouterClient(serverEnv.OPENROUTER_API_KEY);
export async function runChunkBrandDocument(payload: { inputText: string }) {
   const { inputText } = payload;
   // Removed logger.info: Starting brand document chunking
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
   // Removed logger.info: Chunking complete
   return {
      chunks,
   };
}
