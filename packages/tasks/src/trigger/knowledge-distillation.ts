import { logger, task } from "@trigger.dev/sdk/v3";
import { InvalidInputError } from "@packages/errors";
import type { KnowledgePoint } from "@packages/chroma-db/knowledge-point-schema";
import type { ChromaClient } from "@packages/chroma-db/client";
import {
  addToCollection,
  createCollection,
  getCollection,
} from "@packages/chroma-db/helpers";
import { chunkText, knowledgeDistillationPrompts } from "@packages/prompts";
import type { KnowledgeDistillationPrompts } from "@packages/prompts/helpers";
import { parseKnowledgePoints } from "@packages/prompts/helpers";
import type { OpenRouterClient } from "@packages/openrouter/client";
import { generateOpenRouterText } from "@packages/openrouter/helpers";

// --- Types ---
interface Clients {
  openrouter: OpenRouterClient;
  chroma: ChromaClient;
  // Add other clients here as needed
}

interface DistillationInput {
  agentId: string;
  rawText: string;
  sourceType: string;
  sourceIdentifier?: string;
  flow: "low" | "medium" | "high";
  clients: Clients;
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

    // --- 1. Get Prompts for Flow ---
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

    // --- 2. Run Each Stage in Order ---
    let prevOutput: string | string[] = rawText;
    const stageOutputs: Record<string, string | string[]> = {};
    for (let i = 0; i < stageKeys.length; i++) {
      const stageKey = stageKeys[i];
      const promptTemplate = flowPrompts[stageKey];
      if (!promptTemplate)
        throw new InvalidInputError(
          `Missing prompt for ${stageKey} in flow ${flow}`,
        );
      let prompt: string;
      if (i === 0) {
        // Stage 1: chunk rawText if needed
        const chunks = chunkText(rawText);
        if (chunks.length === 1) {
          prompt = promptTemplate
            .replace("{rawText}", chunks[0])
            .replace("{sourceType}", sourceType);
          const response = await generateOpenRouterText(openrouter, [
            {
              prompt,
              maxTokens: 2000,
              temperature: 0.3,
              model: "moonshotai/kimi-k2" as any,
            },
          ]);
          const content = response?.text?.trim?.() || "";
          prevOutput = content;
          stageOutputs[stageKey] = content;
        } else {
          // Multiple chunks: run prompt for each and join results
          const results: string[] = [];
          for (const chunk of chunks) {
            const p = promptTemplate
              .replace("{rawText}", chunk)
              .replace("{sourceType}", sourceType);
            const response = await generateOpenRouterText(openrouter, [
              {
                prompt: p,
                maxTokens: 2000,
                temperature: 0.3,
                model: "moonshotai/kimi-k2" as any,
              },
            ]);
            const content = response?.text?.trim?.() || "";
            if (content.length >= 50) results.push(content);
          }
          prevOutput = results;
          stageOutputs[stageKey] = results;
        }
      } else {
        // Later stages: use previous output as input
        let prev = Array.isArray(prevOutput)
          ? prevOutput.join("\n\n")
          : prevOutput;
        prompt = promptTemplate
          .replace("{sourceType}", sourceType)
          .replace("{basicInsights}", prev)
          .replace("{analyzedContent}", prev)
          .replace("{strategicInsights}", prev)
          .replace("{enrichedInsights}", prev)
          .replace("{validatedInsights}", prev)
          .replace("{preprocessedContent}", prev)
          .replace("{deepAnalysis}", prev)
          .replace("{executiveInsights}", prev);
        const response = await generateOpenRouterText(openrouter, [
          {
            prompt,
            maxTokens: 3000,
            temperature: 0.1,
            model: "moonshotai/kimi-k2" as any,
          },
        ]);
        const text =
          response?.text?.trim?.() ||
          (response as any)?.choices?.[0]?.text?.trim?.() ||
          "";
        prevOutput = text;
        stageOutputs[stageKey] = text;
      }
    }

    // --- 3. Parse Final Output as KnowledgePoints (if possible) ---
    let knowledgePoints: KnowledgePoint[] = [];
    try {
      knowledgePoints = parseKnowledgePoints(
        Array.isArray(prevOutput) ? prevOutput.join("\n\n") : prevOutput,
      );
    } catch (e) {
      // Not all flows/stages will output valid KnowledgePoints, so skip error
    }

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
      import type { Collection } from "chromadb";
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
