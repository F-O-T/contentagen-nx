import {
   blogEditorInputPromp,
   blogEditorPrompt,
   editorObjectSchema,
   type EditorObjectSchema,
} from "@packages/prompts/prompt/editor/blog-editor-prompt";
import { generateOpenRouterObject } from "@packages/openrouter/helpers";
import { createOpenrouterClient } from "@packages/openrouter/client";
import { serverEnv } from "@packages/environment/server";
import { addBillingLlmIngestionJob } from "../../queues/billing-llm-ingestion-queue";
const openrouter = createOpenrouterClient(serverEnv.OPENROUTER_API_KEY);
export async function runEditContentDraft(payload: {
   data: {
      draft: string;
   };
   userId: string;
}) {
   const { data, userId } = payload;
   try {
      const result = await generateOpenRouterObject(
         openrouter,
         {
            model: "small",
         },
         editorObjectSchema,
         {
            prompt: blogEditorInputPromp(data.draft),
            system: blogEditorPrompt(),
         },
      );

      await addBillingLlmIngestionJob({
         inputTokens: result.usage.inputTokens,
         outputTokens: result.usage.outputTokens,
         effort: "small",
         userId,
      });

      const { content } = result.object as EditorObjectSchema;
      return {
         content,
      };
   } catch (error) {
      console.error("Error during chunk distillation:", error);
      throw error;
   }
}
