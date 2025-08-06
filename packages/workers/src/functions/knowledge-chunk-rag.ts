import { serverEnv } from "@packages/environment/server";
import { createChromaClient } from "@packages/chroma-db/client";
import {
   queryCollection,
   getOrCreateCollection,
} from "@packages/chroma-db/helpers";
import { createOpenrouterClient } from "@packages/openrouter/client";
import { generateOpenRouterText } from "@packages/openrouter/helpers";
import {
   descriptionImproverPrompt,
   descriptionImproverInputPrompt,
} from "@packages/prompts/prompt/knowledge/description-improver";
import type { PurposeChannel } from "@packages/database/schema";

const chroma = createChromaClient(serverEnv.CHROMA_DB_URL);
const openrouter = createOpenrouterClient(serverEnv.OPENROUTER_API_KEY);

export async function runKnowledgeChunkRag(payload: {
   agentId: string;
   purpose: PurposeChannel;
   description: string;
}) {
   const { agentId } = payload;

   try {
      const collection = await getOrCreateCollection(chroma, "AgentKnowledge");

      const chunks = await queryCollection(collection.collection, {
         nResults: 50,
         where: {
            agentId: agentId,
         },
         queryTexts: [payload.description],
      });

      // Extract text from the retrieved chunks (assuming chunks.documents is an array of strings)
      const contextChunks = Array.isArray(chunks.documents)
         ? chunks.documents
              .flat()
              .filter((x): x is string => typeof x === "string")
         : [];

      // Build prompts
      const systemPrompt = descriptionImproverPrompt();
      const userPrompt = descriptionImproverInputPrompt(
         payload.description,
         contextChunks,
      );

      // Call LLM to get improved description
      const llmResult = await generateOpenRouterText(
         openrouter,
         {
            model: "small",
            reasoning: "high",
         },
         {
            system: systemPrompt,
            prompt: userPrompt,
         },
      );
      const improvedDescription = llmResult.text || "";

      return {
         chunks,
         improvedDescription,
      };
   } catch (error) {
      console.error("[knowledge-chunk-rag] Error:", error);
      throw error;
   }
}
