import { generateOpenRouterText } from "@packages/openrouter/helpers";
import { createOpenrouterClient } from "@packages/openrouter/client";
import { serverEnv } from "@packages/environment/server";
import { documentIntelligencePrompt } from "@packages/prompts/prompt/brand/document-intelligence";

const openrouter = createOpenrouterClient(serverEnv.OPENROUTER_API_KEY);

export async function runCreateBrandDocument(payload: { rawText: string }) {
   const { rawText } = payload;
   try {
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
         throw new Error("Generated content is empty");
      }
      return { content: result.text.trim() };
   } catch (error) {
      console.error("Error during brand document creation:", error);
      throw error;
   }
}
