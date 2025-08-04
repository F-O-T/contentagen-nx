import { task, logger } from "@trigger.dev/sdk/v3";
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

async function runKnowledgeChunkRag(payload: {
   agentId: string;
   purpose: PurposeChannel;
   query: string;
   description: string;
}) {
   const { agentId } = payload;
   logger.info("[knowledge-chunk-rag] Start", {
      event: "start",
      agentId: payload.agentId,
      query: payload.query,
      payload,
   });

   try {
      logger.info("[knowledge-chunk-rag] Fetching or creating collection", {
         event: "collection_fetch_or_create",
         collectionName: "AgentKnowledge",
         agentId,
      });
      const collection = await getOrCreateCollection(chroma, "AgentKnowledge");

      logger.info("[knowledge-chunk-rag] Querying collection", {
         event: "query_collection",
         agentId,
         query: payload.query,
         collectionName: collection.collection.name,
      });
      const chunks = await queryCollection(collection.collection, {
         nResults: 10,
         where: {
            agentId: agentId,
         },
         queryTexts: [payload.query],
      });

      logger.info("[knowledge-chunk-rag] Chunks retrieved", {
         event: "query_success",
         chunkCount: chunks.ids.length,
         agentId,
         collectionName: collection.collection.name,
      });

      // Extract text from the retrieved chunks (assuming chunks.documents is an array of strings)
      const contextChunks = Array.isArray(chunks.documents)
         ? chunks.documents
              .flat()
              .filter((x): x is string => typeof x === "string")
         : [];

      // Build prompts
      const systemPrompt = descriptionImproverPrompt(payload.purpose);
      const userPrompt = descriptionImproverInputPrompt(
         payload.description,
         contextChunks,
      );

      // Call LLM to get improved description
      const llmResult = await generateOpenRouterText(openrouter, {
         system: systemPrompt,
         prompt: userPrompt,
      });
      const improvedDescription = llmResult.text || "";

      return {
         chunks,
         improvedDescription,
      };
   } catch (error) {
      logger.error("[knowledge-chunk-rag] Error", {
         event: "error",
         agentId,
         error: error instanceof Error ? error.message : error,
         name: error instanceof Error ? error.name : undefined,
         stack: error instanceof Error ? error.stack : undefined,
         payload,
      });
      throw error;
   } finally {
      logger.info("[knowledge-chunk-rag] Finished", {
         event: "finish",
         agentId,
      });
   }
}

export const knowledgeChunkRag = task({
   id: "knowledge-chunk-rag-job",
   run: runKnowledgeChunkRag,
});
