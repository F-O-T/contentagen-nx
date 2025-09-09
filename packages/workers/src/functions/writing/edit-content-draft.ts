import {
   interviewEditorPrompt,
   interviewEditorInputPrompt,
   interviewEditorSchema,
   type InterviewEditorSchema,
} from "@packages/prompts/prompt/editor/blog-interview-editor-prompt";
import {
   changelogEditorInputPrompt,
   changelogEditorPrompt,
   changelogEditorSchema,
   type ChangelogEditorSchema,
} from "@packages/prompts/prompt/editor/blog-changelog-editor-prompt";
import {
   tutorialEditorInputPrompt,
   tutorialEditorPrompt,
   tutorialEditorSchema,
   type TutorialEditorSchema,
} from "@packages/prompts/prompt/editor/blog-tutorial-editor-prompt";

import {
   blogEditorInputPrompt,
   blogEditorPrompt,
   editorObjectSchema,
   type EditorObjectSchema,
} from "@packages/prompts/prompt/editor/blog-editor-prompt";
import { generateOpenRouterObject } from "@packages/openrouter/helpers";
import { createOpenrouterClient } from "@packages/openrouter/client";
import { serverEnv } from "@packages/environment/server";
import { enqueueBillingLlmIngestionJob } from "../../queues/billing-llm-ingestion-queue";
import type { ContentRequest } from "@packages/database/schema";
const openrouter = createOpenrouterClient(serverEnv.OPENROUTER_API_KEY);
export async function runEditContentDraft(payload: {
   data: {
      draft: string;
      contentRequest: ContentRequest;
   };
   userId: string;
}) {
   const { data, userId } = payload;
   const { draft, contentRequest } = data;
   try {
      const getSystemPrompt = () => {
         if (contentRequest.layout === "tutorial") {
            return tutorialEditorPrompt();
         }
         if (contentRequest.layout === "interview") {
            return interviewEditorPrompt();
         }
         if (contentRequest.layout === "changelog") {
            return changelogEditorPrompt();
         }
         return blogEditorPrompt();
      };
      const getSchema = () => {
         if (contentRequest.layout === "tutorial") {
            return tutorialEditorSchema;
         }
         if (contentRequest.layout === "interview") {
            return interviewEditorSchema;
         }
         if (contentRequest.layout === "changelog") {
            return changelogEditorSchema;
         }
         return editorObjectSchema;
      };
      const getInputPrompt = () => {
         if (contentRequest.layout === "tutorial") {
            return tutorialEditorInputPrompt(draft);
         }
         if (contentRequest.layout === "interview") {
            return interviewEditorInputPrompt(draft);
         }
         if (contentRequest.layout === "changelog") {
            return changelogEditorInputPrompt(draft);
         }
         return blogEditorInputPrompt(draft);
      };

      const result = await generateOpenRouterObject(
         openrouter,
         {
            model: "small",
         },
         getSchema(),
         {
            prompt: getInputPrompt(),
            system: getSystemPrompt(),
         },
      );

      await enqueueBillingLlmIngestionJob({
         inputTokens: result.usage.inputTokens,
         outputTokens: result.usage.outputTokens,
         effort: "small",
         userId,
      });

      const { content } = result.object as
         | EditorObjectSchema
         | ChangelogEditorSchema
         | InterviewEditorSchema
         | TutorialEditorSchema;
      return {
         content,
      };
   } catch (error) {
      console.error("Error during chunk distillation:", error);
      throw error;
   }
}
