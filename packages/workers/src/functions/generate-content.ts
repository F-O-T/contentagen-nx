import { writingInputPrompt } from "@packages/prompts/prompt/text/writing";
import { generateOpenRouterText } from "@packages/openrouter/helpers";
import { createOpenrouterClient } from "@packages/openrouter/client";
import { serverEnv } from "@packages/environment/server";
import type { ContentRequest, PersonaConfig } from "@packages/database/schema";
import { generateSystemPrompt } from "@packages/prompts/helpers/agent-system-prompt-assembler";
import { createAiUsageMetadata } from "@packages/payment/ingestion";
import { runIngestBilling } from "./ingest-usage";

const openrouter = createOpenrouterClient(serverEnv.OPENROUTER_API_KEY);

export async function runGenerateContent(payload: {
   agent: { personaConfig: PersonaConfig };
   brandDocument: string;
   webSearchContent: string;
   contentRequest: ContentRequest;
   userId: string;
}) {
   const { agent, contentRequest, brandDocument, webSearchContent, userId } =
      payload;
   try {
      const agentSystemPrompt = generateSystemPrompt(agent.personaConfig);
      const result = await generateOpenRouterText(
         openrouter,
         {
            model: "small",
            reasoning: "high",
         },
         {
            system: agentSystemPrompt,
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
      if (!result.usage.inputTokens || !result.usage.outputTokens) {
         console.error(
            "[runChunkBrandDocument] ERROR: No tokens used in chunking",
         );
         throw new Error("No tokens used in chunking");
      }
      await runIngestBilling({
         params: {
            metadata: createAiUsageMetadata({
               effort: "small",
               inputTokens: result.usage.inputTokens,
               outputTokens: result.usage.outputTokens,
            }),
            event: "LLM",
            externalCustomerId: userId, // This is a system-level operation, not user-specific
         },
      });

      return { content: result.text.trim() };
   } catch (error) {
      console.error("Error during content generation:", error);
      throw error;
   }
}
