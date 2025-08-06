import { writingInputPrompt } from "@packages/prompts/prompt/text/writing";
import { generateOpenRouterText } from "@packages/openrouter/helpers";
import { createOpenrouterClient } from "@packages/openrouter/client";
import { serverEnv } from "@packages/environment/server";
import type { ContentRequest } from "@packages/database/schema";

const openrouter = createOpenrouterClient(serverEnv.OPENROUTER_API_KEY);

export async function runGenerateContent(payload: {
   agent: { systemPrompt: string };
   brandDocument: string;
   webSearchContent: string;
   contentRequest: ContentRequest;
}) {
   const { agent, contentRequest, brandDocument, webSearchContent } = payload;
   try {
      const result = await generateOpenRouterText(
         openrouter,
         {
            model: "small",
            reasoning: "high",
         },
         {
            system: agent.systemPrompt,
            prompt: writingInputPrompt(
               brandDocument,
               webSearchContent,
               contentRequest.description,
            ),
         },
      );
      if (!result.text || result.text.trim() === "") {
         throw new Error("Generated content is empty");
      }
      return { content: result.text.trim() };
   } catch (error) {
      console.error("Error during content generation:", error);
      throw error;
   }
}
