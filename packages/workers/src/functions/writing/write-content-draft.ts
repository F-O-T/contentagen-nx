import {
   changelogDraftSystemPrompt,
   interviewDraftSystemPrompt,
   tutorialDraftSystemPrompt,
   writingDraftInputPrompt,
   type WritingDraftSchema,
   writingDraftSchema,
   writingDraftSystemPrompt,
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
      const getSystemPrompt = () => {
         if (contentRequest.layout === "tutorial") {
            return tutorialDraftSystemPrompt();
         }
         if (contentRequest.layout === "interview") {
            return interviewDraftSystemPrompt();
         }
         if (contentRequest.layout === "changelog") {
            return changelogDraftSystemPrompt();
         }
         return writingDraftSystemPrompt();
      };
      const systemPrompt = [
         generateWritingPrompt(personaConfig),
         getSystemPrompt(),
      ]
         .filter(Boolean)
         .join(`\n\n${"=".repeat(80)}\n\n`);

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
            system: systemPrompt,
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
