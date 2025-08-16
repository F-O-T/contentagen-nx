import { serverEnv } from "@packages/environment/server";
import { createOpenrouterClient } from "@packages/openrouter/client";
import { generateOpenRouterText } from "@packages/openrouter/helpers";
import {
   descriptionImproverPrompt,
   descriptionImproverInputPrompt,
} from "@packages/prompts/prompt/knowledge/description-improver";
import { ingestLlmBilling } from "./ingest-usage";

const openrouter = createOpenrouterClient(serverEnv.OPENROUTER_API_KEY);

export async function runGenerateBrandDocument(payload: {
   chunks: string[];
   userId: string;
   description: string;
}) {
   const { chunks, description, userId } = payload;

   try {
      // Build prompts
      const systemPrompt = descriptionImproverPrompt();
      const userPrompt = descriptionImproverInputPrompt(description, chunks);

      // Call LLM to get improved description
      const llmResult = await generateOpenRouterText(
         openrouter,
         {
            model: "small",
            reasoning: "high",
         },
         {
            system: systemPrompt,
            prompt: userPrompt,
         },
      );
      const brandDocument = llmResult.text || "";

      await ingestLlmBilling({
         inputTokens: llmResult.usage.inputTokens,
         outputTokens: llmResult.usage.outputTokens,
         effort: "small",
         userId,
      });
      return {
         brandDocument,
      };
   } catch (error) {
      console.error("[knowledge-chunk-rag] Error:", error);
      throw error;
   }
}
