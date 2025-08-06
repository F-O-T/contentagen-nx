import { generateOpenRouterText } from "@packages/openrouter/helpers";
import { createOpenrouterClient } from "@packages/openrouter/client";
import { serverEnv } from "@packages/environment/server";
import { documentIntelligencePrompt } from "@packages/prompts/prompt/brand/document-intelligence";

const openrouter = createOpenrouterClient(serverEnv.OPENROUTER_API_KEY);

export async function runCreateBrandDocument(payload: { rawText: string }) {
   const { rawText } = payload;
   try {
      console.log(`[runCreateBrandDocument] Creating brand document from raw text (length: ${rawText.length})`);
      const model: { model: "small"; reasoning: "high" } = {
         model: "small",
         reasoning: "high",
      };
      const promptConfig = {
         system: documentIntelligencePrompt(),
         prompt: rawText,
      };
      const result = await generateOpenRouterText(
         openrouter,
         model,
         promptConfig,
      );
      if (!result.text || result.text.trim() === "") {
         console.error("[runCreateBrandDocument] ERROR: Generated content is empty");
         throw new Error("Generated content is empty");
      }
      console.log(`[runCreateBrandDocument] Brand document generated (length: ${result.text.trim().length})`);
      return { content: result.text.trim() };
   } catch (error) {
      console.error("[runCreateBrandDocument] Unhandled error:", error);
      throw error;
   }
}
