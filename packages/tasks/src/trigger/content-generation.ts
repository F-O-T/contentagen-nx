import { logger, task } from "@trigger.dev/sdk/v3";
import { InvalidInputError } from "@packages/errors";
import { contentGenerationPrompts } from "@packages/prompts";
import type {
  ContentGenerationPrompts,
  PromptType,
  StageMap,
} from "@packages/prompts/helpers";
import { generateOpenRouterText } from "@packages/openrouter/helpers";

import type { OpenRouterClient } from "@packages/openrouter/client";

interface Clients {
  openrouter: OpenRouterClient;
}

interface ContentGenerationInput {
  agentId: string;
  topic: string;
  briefDescription: string;
  sourceType: string;
  additionalContext?: string;
  flow: PromptType;
  clients: Clients;
}
// Article output type (superset for all flows)
export interface Article {
  title: string;
  body: string;
  summary: string;
  keywords: string[];
  tags: string[];
  sources: string[];
  wordCount: number;
  readingTime: number;
  sections?: string[];
  qualityScores?: Record<string, number>;
  qualityJustification?: string;
}

// Helper to process a single chunk with a prompt
async function processChunkWithPrompt({
  chunk,
  promptTemplate,
  topic,
  briefDescription,
  additionalContext,
  openrouter,
  maxTokens = 2000,
  temperature = 0.3,
}: {
  chunk: string;
  promptTemplate: string;
  topic: string;
  briefDescription: string;
  additionalContext?: string;
  openrouter: OpenRouterClient;
  maxTokens?: number;
  temperature?: number;
}) {
  const prompt = promptTemplate
    .replace("{rawText}", chunk)
    .replace("{topic}", topic)
    .replace("{briefDescription}", briefDescription)
    .replace("{additionalContext}", additionalContext || "");
  const response = await generateOpenRouterText(openrouter, {
    prompt,
    maxTokens,
    temperature,
  });
  return response?.text?.trim?.() || "";
}

// Helper to process all chunks for the first stage
async function processFirstStageChunks({
  topic,
  briefDescription,
  additionalContext,
  promptTemplate,
  openrouter,
}: {
  topic: string;
  briefDescription: string;
  additionalContext?: string;
  promptTemplate: string;
  openrouter: OpenRouterClient;
}) {
  // For content generation, we don't chunk the topic/desc, just use as one chunk
  const chunk = "";
  const content = await processChunkWithPrompt({
    chunk,
    promptTemplate,
    topic,
    briefDescription,
    additionalContext,
    openrouter,
  });
  return { output: content, results: [content] };
}

// Helper to run all content generation stages in order
async function runContentGenerationStages({
  flowPrompts,
  stageKeys,
  topic,
  briefDescription,
  additionalContext,
  openrouter,
}: {
  flowPrompts: Record<string, string>;
  stageKeys: string[];
  topic: string;
  briefDescription: string;
  additionalContext?: string;
  openrouter: OpenRouterClient;
}) {
  let prevOutput: string | string[] = "";
  const stageOutputs: Record<string, string | string[]> = {};
  if (!flowPrompts) throw new InvalidInputError(`Prompts not loaded for flow`);
  const promptsForFlow = flowPrompts as Record<string, string>;
  for (let i = 0; i < stageKeys.length; i++) {
    const stageKey = stageKeys[i] as string;
    if (!(stageKey in promptsForFlow)) {
      throw new InvalidInputError(`Missing prompt for ${stageKey} in flow`);
    }
    const promptTemplate = promptsForFlow[stageKey];
    if (!promptTemplate)
      throw new InvalidInputError(`Missing prompt for ${stageKey} in flow`);
    if (i === 0) {
      // Stage 1: generate article
      const { output } = await processFirstStageChunks({
        topic,
        briefDescription,
        additionalContext,
        promptTemplate,
        openrouter,
      });
      prevOutput = output;
      stageOutputs[stageKey] = output;
    } else {
      // Later stages: use previous output as input
      const prev = Array.isArray(prevOutput)
        ? prevOutput.join("\n\n")
        : prevOutput;
      const prompt = promptTemplate
        .replace("{basicArticle}", prev)
        .replace("{structuredArticle}", prev)
        .replace("{articleSummary}", prev)
        .replace("{advancedArticle}", prev)
        .replace("{qualityEvaluation}", prev)
        .replace("{topic}", topic)
        .replace("{briefDescription}", briefDescription)
        .replace("{additionalContext}", additionalContext || "");
      const response = await generateOpenRouterText(openrouter, {
        prompt,
        maxTokens: 3000,
        temperature: 0.1,
      });
      const text = response?.text?.trim?.();
      prevOutput = text;
      stageOutputs[stageKey] = text;
    }
  }
  return { finalOutput: prevOutput, stageOutputs };
}

export const contentGenerationTask = task({
  id: "content-generation",
  maxDuration: 600, // 10 minutes
  run: async (
    payload: ContentGenerationInput,
  ): Promise<{
    article: Article | string;
    stageOutputs: Record<string, string | string[]>;
  }> => {
    logger.log("Starting content generation", { payload });
    const { clients, flow, topic, briefDescription, additionalContext } =
      payload;
    const openrouter = clients.openrouter;

    if (
      !contentGenerationPrompts ||
      typeof contentGenerationPrompts !== "object"
    )
      throw new InvalidInputError("Prompts not loaded");
    const prompts: ContentGenerationPrompts = contentGenerationPrompts;
    const flowPrompts: StageMap = prompts[flow];
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

    const { finalOutput, stageOutputs } = await runContentGenerationStages({
      flowPrompts,
      stageKeys,
      topic,
      briefDescription,
      additionalContext,
      openrouter,
    });

    // Try to parse the final output as JSON (for the last stage)
    let article: Article | string = finalOutput;
    try {
      if (typeof finalOutput === "string") {
        const parsed = JSON.parse(finalOutput);
        // Basic runtime check for required fields
        if (
          typeof parsed === "object" &&
          parsed !== null &&
          typeof parsed.title === "string" &&
          typeof parsed.body === "string" &&
          typeof parsed.summary === "string" &&
          Array.isArray(parsed.keywords) &&
          Array.isArray(parsed.tags) &&
          Array.isArray(parsed.sources) &&
          typeof parsed.wordCount === "number" &&
          typeof parsed.readingTime === "number"
        ) {
          article = parsed as Article;
        } else {
          article = finalOutput;
        }
      }
    } catch (e) {
      logger.log("Failed to parse article JSON", { error: e, finalOutput });
    }

    // Optionally: store article in Chroma DB or elsewhere if needed
    // ...

    return {
      article,
      stageOutputs,
    };
  },
});
