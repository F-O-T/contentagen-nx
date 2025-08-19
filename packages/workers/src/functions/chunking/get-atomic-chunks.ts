import { generateOpenRouterObject } from "@packages/openrouter/helpers";
import {
   chunkingInputPrompt,
   chunkingPrompt,
   chunkingSchema,
   type ChunkingSchema,
} from "@packages/prompts/prompt/text/chunking";
import { createOpenrouterClient } from "@packages/openrouter/client";
import { serverEnv } from "@packages/environment/server";
import { addBillingLlmIngestionJob } from "../../helper-queues/billing-llm-ingestion-queue";
const openrouter = createOpenrouterClient(serverEnv.OPENROUTER_API_KEY);
export async function runCreateBrandDocuments(payload: {
   inputText: string;
   userId: string;
}) {
   const { inputText, userId } = payload;
   try {
      const brandDocumentsResult = await generateOpenRouterObject(
         openrouter,
         {
            model: "small",
         },
         chunkingSchema,
         {
            system: chunkingPrompt(),
            prompt: chunkingInputPrompt(inputText),
         },
      );
      await addBillingLlmIngestionJob({
         inputTokens: brandDocumentsResult.usage.inputTokens,
         outputTokens: brandDocumentsResult.usage.outputTokens,
         effort: "small",
         userId,
      });
      const { chunks } = brandDocumentsResult.object as ChunkingSchema;

      return {
         chunks,
      };
   } catch (error) {
      console.error("Error during text chunking:", error);
      throw error;
   }
}
