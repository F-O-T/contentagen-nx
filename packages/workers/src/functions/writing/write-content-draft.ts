import {
   writingDraftInputPrompt,
   type WritingDraftSchema,
   writingDraftSystemPrompt,
   writingDraftSchema,
} from "@packages/prompts/prompt/writing/writing-draft";
import { generateOpenRouterObject } from "@packages/openrouter/helpers";
import { createOpenrouterClient } from "@packages/openrouter/client";
import { serverEnv } from "@packages/environment/server";
import { addBillingLlmIngestionJob } from "../../queues/billing-llm-ingestion-queue";
import type { ContentRequest } from "@packages/database/schema";
const openrouter = createOpenrouterClient(serverEnv.OPENROUTER_API_KEY);
export async function runWriteContentDraft(payload: {
   data: {
      brandDocument: string;
      webSearchContent: string;
      contentRequest: ContentRequest;
   };
   userId: string;
}) {
   const { data, userId } = payload;
   const { brandDocument, webSearchContent, contentRequest } = data;
   try {
      const result = await generateOpenRouterObject(
         openrouter,
         {
            model: "small",
         },
         writingDraftSchema,
         {
            prompt: writingDraftInputPrompt(
               contentRequest.description,
               brandDocument,
               webSearchContent,
            ),
            system: writingDraftSystemPrompt(),
         },
      );

      await addBillingLlmIngestionJob({
         inputTokens: result.usage.inputTokens,
         outputTokens: result.usage.outputTokens,
         effort: "small",
         userId,
      });

      const { draft } = result.object as WritingDraftSchema;
      return {
         draft,
      };
   } catch (error) {
      console.error("Error during chunk distillation:", error);
      throw error;
   }
}
