import { task, logger } from "@trigger.dev/sdk/v3";
import { generateOpenRouterText } from "@packages/openrouter/helpers";
import { createOpenrouterClient } from "@packages/openrouter/client";
import { serverEnv } from "@packages/environment/server";
import type { ContentRequest } from "@packages/database/schema";

const openrouter = createOpenrouterClient(serverEnv.OPENROUTER_API_KEY);

async function runGenerateContent(payload: {
   agent: { systemPrompt: string };
   brandDocument: string;
   contentRequest: ContentRequest;
}) {
   const { agent, contentRequest, brandDocument } = payload;
   try {
      logger.info("Generating content", {
         description: contentRequest.description,
      });
      const result = await generateOpenRouterText(
         openrouter,
         {
            model: "small",
            reasoning: "high",
         },
         {
            system: agent.systemPrompt,
            prompt: `brand document:${brandDocument}, request:${contentRequest.description}`,
         },
      );
      logger.info("Content generated", { length: result.text.length });
      if (!result.text || result.text.trim() === "") {
         throw new Error("Generated content is empty");
      }
      return { content: result.text.trim() };
   } catch (error) {
      logger.error("Error in generate content task", {
         error: error instanceof Error ? error.message : error,
      });
      throw error;
   }
}

export const generateContentTask = task({
   id: "generate-content-job",
   run: runGenerateContent,
});
