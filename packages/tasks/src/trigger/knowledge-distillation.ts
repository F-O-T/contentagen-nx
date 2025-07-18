import { logger, task } from "@trigger.dev/sdk/v3";
import type { Collection } from "chromadb";

import { InvalidInputError } from "@packages/errors";
import type { KnowledgePoint } from "@packages/chroma-db/knowledge-point-schema";
import type { ChromaClient } from "@packages/chroma-db/client";
import {
   addToCollection,
   createCollection,
   getCollection,
} from "@packages/chroma-db/helpers";
import { knowledgeDistillationPrompts, chunkText } from "@packages/prompts";
import type { KnowledgeDistillationPrompts } from "@packages/prompts/helpers";
import { parseKnowledgePoints } from "@packages/prompts/helpers";
import type { OpenRouterClient } from "@packages/openrouter/client";
import { generateOpenRouterText } from "@packages/openrouter/helpers";

interface Clients {
   openrouter: OpenRouterClient;
   chroma: ChromaClient;
}

interface DistillationInput {
   agentId: string;
   rawText: string;
   sourceType: string;
   sourceIdentifier?: string;
   flow: "low" | "medium" | "high";
   clients: Clients;
}

// Helper to process a single chunk with a prompt
async function processChunkWithPrompt({
   chunk,
   promptTemplate,
   sourceType,
   openrouter,
   maxTokens = 2000,
   temperature = 0.3,
}: {
   chunk: string;
   promptTemplate: string;
   sourceType: string;
   openrouter: OpenRouterClient;
   maxTokens?: number;
   temperature?: number;
}) {
   const prompt = promptTemplate
      .replace("{rawText}", chunk)
      .replace("{sourceType}", sourceType);
   const response = await generateOpenRouterText(openrouter, {
      prompt,
      maxTokens,
      temperature,
   });
   return response?.text?.trim?.() || "";
}

// Helper to process all chunks for the first stage
async function processFirstStageChunks({
   rawText,
   promptTemplate,
   sourceType,
   openrouter,
}: {
   rawText: string;
   promptTemplate: string;
   sourceType: string;
   openrouter: OpenRouterClient;
}) {
   const chunks = chunkText(rawText);
   if (chunks.length === 1 && chunks[0]) {
      const content = await processChunkWithPrompt({
         chunk: chunks[0],
         promptTemplate,
         sourceType,
         openrouter,
      });
      return { output: content, results: [content] };
   } else {
      const results: string[] = [];
      for (const chunk of chunks) {
         const content = await processChunkWithPrompt({
            chunk,
            promptTemplate,
            sourceType,
            openrouter,
         });
         if (content.length >= 50) results.push(content);
      }
      return { output: results, results };
   }
}

// Helper to run all distillation stages in order, clean and type-inferred
async function runDistillationStages({
   flowPrompts,
   stageKeys,
   rawText,
   sourceType,
   openrouter,
}: {
   flowPrompts: Record<string, string>;
   stageKeys: string[];
   rawText: string;
   sourceType: string;
   openrouter: OpenRouterClient;
}) {
   let prevOutput: string | string[] = rawText;
   const stageOutputs: Record<string, string | string[]> = {};
   for (let i = 0; i < stageKeys.length; i++) {
      const stageKey = stageKeys[i];
      const promptTemplate = flowPrompts[String(stageKey)];
      if (!promptTemplate)
         throw new InvalidInputError(`Missing prompt for ${stageKey} in flow`);
      if (i === 0) {
         // Stage 1: chunk and process using helpers
         const { output } = await processFirstStageChunks({
            rawText,
            promptTemplate,
            sourceType,
            openrouter,
         });
         if (!stageKey) {
            throw new InvalidInputError(`Invalid stage key: ${stageKey}`);
         }
         prevOutput = output;
         stageOutputs[stageKey] = output;
      } else {
         // Later stages: use previous output as input
         const prev = Array.isArray(prevOutput)
            ? prevOutput.join("\n\n")
            : prevOutput;
         const prompt = replaceStagePromptPlaceholders(
            promptTemplate,
            prev,
            sourceType,
         );
         const response = await generateOpenRouterText(openrouter, {
            prompt,
            maxTokens: 3000,
            temperature: 0.1,
         });
         const text = response?.text?.trim?.();
         prevOutput = text;
         if (!stageKey) {
            throw new InvalidInputError(`Invalid stage key: ${stageKey}`);
         }
         stageOutputs[stageKey] = text;
      }
   }
   return { finalOutput: prevOutput, stageOutputs };
}

// Helper to replace all possible placeholders in stage prompts
function replaceStagePromptPlaceholders(
   promptTemplate: string,
   prev: string,
   sourceType: string,
): string {
   return promptTemplate
      .replace("{sourceType}", sourceType)
      .replace("{basicInsights}", prev)
      .replace("{analyzedContent}", prev)
      .replace("{strategicInsights}", prev)
      .replace("{enrichedInsights}", prev)
      .replace("{validatedInsights}", prev)
      .replace("{preprocessedContent}", prev)
      .replace("{deepAnalysis}", prev)
      .replace("{executiveInsights}", prev);
}

export const knowledgeDistillationTask = task({
   id: "knowledge-distillation",
   maxDuration: 600, // 10 minutes
   run: async (
      payload: DistillationInput,
   ): Promise<{
      knowledgePoints: KnowledgePoint[];
      stageOutputs: Record<string, string | string[]>;
   }> => {
      logger.log("Starting knowledge distillation", { payload });
      const { clients, flow, rawText, sourceType, agentId } = payload;
      const openrouter = clients.openrouter;
      const chromaClient = clients.chroma;

      const flowPrompts = (
         knowledgeDistillationPrompts as KnowledgeDistillationPrompts
      )[flow];

      if (!flowPrompts) throw new InvalidInputError(`Unknown flow: ${flow}`);
      const stageKeys = Object.keys(flowPrompts)
         .filter((k) => k.startsWith("stage-"))
         .sort((a, b) => {
            const na = parseInt(a.split("-")[1] ?? "0", 10);
            const nb = parseInt(b.split("-")[1] ?? "0", 10);
            return na - nb;
         });
      if (stageKeys.length === 0)
         throw new InvalidInputError(`No stages found for flow: ${flow}`);

      const { finalOutput: prevOutput, stageOutputs } =
         await runDistillationStages({
            flowPrompts,
            stageKeys,
            rawText,
            sourceType,
            openrouter,
         });

      const knowledgePoints = parseKnowledgePoints(
         Array.isArray(prevOutput) ? prevOutput.join("\n\n") : prevOutput,
      );

      // --- 4. Store in Chroma DB ---
      async function storeKnowledgePoints(
         agentId: string,
         sourceType: string,
         knowledgePoints: KnowledgePoint[],
      ) {
         if (!knowledgePoints.length) return;
         logger.log("Storing knowledge points in Chroma DB", {
            count: knowledgePoints.length,
         });
         const collectionName = `knowledge_distillation_${agentId}`;
         let collection: Collection;
         try {
            collection = await getCollection(chromaClient, collectionName);
         } catch {
            collection = await createCollection(chromaClient, {
               name: collectionName,
            });
         }
         await addToCollection(collection, {
            ids: knowledgePoints.map((_, i) => `${agentId}_${Date.now()}_${i}`),
            documents: knowledgePoints.map((kp) => kp.content),
            metadatas: knowledgePoints.map((kp) => {
               const meta: Record<string, string | number | boolean | null> = {
                  content: kp.content,
                  summary: kp.summary,
                  agentId,
                  sourceType,
               };
               if (kp.keywords)
                  meta.keywords = Array.isArray(kp.keywords)
                     ? kp.keywords.join(", ")
                     : String(kp.keywords);
               if (kp.category) meta.category = String(kp.category);
               if (kp.source) meta.source = String(kp.source);
               return meta;
            }),
         });
         logger.log("Knowledge distillation complete and stored in Chroma DB", {
            count: knowledgePoints.length,
         });
      }

      await storeKnowledgePoints(agentId, sourceType, knowledgePoints);

      return {
         knowledgePoints,
         stageOutputs,
      };
   },
});
