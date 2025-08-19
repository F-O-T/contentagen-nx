import { generateOpenRouterObject } from "@packages/openrouter/helpers";
import {
   brandDocumentChunkingPrompt,
   brandDocumentInputPrompt,
   brandDocumentsSchema,
   type BrandDocumentsSchema,
} from "@packages/prompts/prompt/text/document-chunking";
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
         brandDocumentsSchema,
         {
            system: brandDocumentChunkingPrompt(),
            prompt: brandDocumentInputPrompt(inputText),
         },
      );
      await addBillingLlmIngestionJob({
         inputTokens: brandDocumentsResult.usage.inputTokens,
         outputTokens: brandDocumentsResult.usage.outputTokens,
         effort: "small",
         userId,
      });
      const { documents } = brandDocumentsResult.object as BrandDocumentsSchema;

      return {
         documents,
      };
   } catch (error) {
      console.error("Error during text chunking:", error);
      throw error;
   }
}
