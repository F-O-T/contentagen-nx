import {
   writingDraftInputPrompt,
   type WritingDraftSchema,
   writingDraftSchema,
   writingDraftSystemPrompt,
} from "@packages/prompts/prompt/writing/writing-draft";
import {
   changelogDraftSystemPrompt,
   changelogDraftInputPrompt,
   changelogDraftSchema,
   ChangelogDraftSchema,
} from "@packages/prompts/prompt/writing/changelog-writing-draft";
import {
   interviewDraftSystemPrompt,
   interviewDraftInputPrompt,
   interviewDraftSchema,
   InterviewDraftSchema,
} from "@packages/prompts/prompt/writing/interview-writing-draft";
import {
   tutorialDraftSystemPrompt,
   tutorialDraftInputPrompt,
   tutorialDraftSchema,
   TutorialDraftSchema,
} from "@packages/prompts/prompt/writing/tutorial-writing-draft";
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
      const getSchema = () => {
         if (contentRequest.layout === "tutorial") {
            return tutorialDraftSchema;
         }
         if (contentRequest.layout === "interview") {
            return interviewDraftSchema;
         }
         if (contentRequest.layout === "changelog") {
            return changelogDraftSchema;
         }
         return writingDraftSchema;
      };
      const getInputPrompt = () => {
         if (contentRequest.layout === "tutorial") {
            return tutorialDraftInputPrompt(
               contentRequest.description,
               brandDocument,
               webSearchContent,
            );
         }
         if (contentRequest.layout === "interview") {
            return interviewDraftInputPrompt(
               contentRequest.description,
               brandDocument,
               webSearchContent,
            );
         }
         if (contentRequest.layout === "changelog") {
            return changelogDraftInputPrompt(
               contentRequest.description,
               brandDocument,
               webSearchContent,
            );
         }
         return writingDraftInputPrompt(
            contentRequest.description,
            brandDocument,
            webSearchContent,
         );
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
         getSchema(),
         {
            prompt: getInputPrompt(),
            system: systemPrompt,
         },
      );

      await enqueueBillingLlmIngestionJob({
         inputTokens: result.usage.inputTokens,
         outputTokens: result.usage.outputTokens,
         effort: "small",
         userId,
      });

      const { draft } = result.object as
         | WritingDraftSchema
         | ChangelogDraftSchema
         | InterviewDraftSchema
         | TutorialDraftSchema;
      return {
         draft,
      };
   } catch (error) {
      console.error("Error during chunk distillation:", error);
      throw error;
   }
}
