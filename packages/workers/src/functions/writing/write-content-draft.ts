import {
   writingDraftInputPrompt,
   type WritingDraftSchema,
   writingDraftSchema,
} from "@packages/prompts/prompt/writing/writing-draft";
import { generateOpenRouterObject } from "@packages/openrouter/helpers";
import { createOpenrouterClient } from "@packages/openrouter/client";
import { serverEnv } from "@packages/environment/server";
import { enqueueBillingLlmIngestionJob } from "../../queues/billing-llm-ingestion-queue";
import type { ContentRequest, PersonaConfig } from "@packages/database/schema";
import { generateWritingPrompt } from "@packages/prompts/helpers/assemble-writing-prompt";
const openrouter = createOpenrouterClient(serverEnv.OPENROUTER_API_KEY);
export async function runWriteContentDraft(payload: {
   data: {
      brandDocument: string;
      webSearchContent: string;
      contentRequest: ContentRequest;
      personaConfig: PersonaConfig;
   };
   userId: string;
}) {
   const { data, userId } = payload;
   const { brandDocument, webSearchContent, contentRequest, personaConfig } =
      data;
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
            system: generateWritingPrompt(personaConfig),
         },
      );

      await enqueueBillingLlmIngestionJob({
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
