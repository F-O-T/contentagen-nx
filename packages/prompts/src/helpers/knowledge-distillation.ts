import { Type } from "@sinclair/typebox";
import type { Static } from "@sinclair/typebox";
import { KnowledgePointSchema } from "@packages/chroma-db/knowledge-point-schema";

export const KnowledgePointsArraySchema = Type.Array(KnowledgePointSchema);
export type KnowledgePoint = Static<typeof KnowledgePointSchema>;
export type KnowledgePointsArray = Static<typeof KnowledgePointsArraySchema>;

import { Value } from "@sinclair/typebox/value";
import { InvalidInputError } from "@packages/errors";

import { createOpenrouterClient } from "@packages/openrouter/client";
import { generateOpenRouterText } from "@packages/openrouter/helpers";
import chunkingPromptJson from "../prompt-files/chunking.json";
export function parseKnowledgePoints(jsonString: string): KnowledgePointsArray {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch (e) {
    throw new InvalidInputError(
      `Invalid JSON: ${e instanceof Error ? e.message : String(e)}`,
    );
  }
  if (!Value.Check(KnowledgePointsArraySchema, parsed)) {
    throw new InvalidInputError(
      "Parsed value does not match KnowledgePointsArray schema",
    );
  }
  return parsed as KnowledgePointsArray;
}

export async function chunkText(
  text: string,
  chunkSize: number = 2000,
  apiKey?: string,
): Promise<string[]> {
  if (chunkSize <= 0) {
    throw new Error("chunkSize must be a positive integer");
  }
  if (!apiKey) {
    throw new Error("OpenRouter API key is required");
  }
  const chunkingPrompt = chunkingPromptJson.chunking;
  const prompt = chunkingPrompt
    .replace("{chunkSize}", String(chunkSize))
    .replace("{overlap}", "100")
    .replace("{text}", text);
  const client = createOpenrouterClient(apiKey);
  const response = await generateOpenRouterText(client, {
    prompt,
    maxTokens: 4096,
    temperature: 0.2,
  });
  let chunks: string[] = [];
  try {
    const match = response.text.match(/\[.*\]/s);
    if (match) {
      chunks = JSON.parse(match[0]);
    } else {
      throw new Error("No JSON array found in LLM response");
    }
  } catch (err) {
    throw new Error(`Failed to parse LLM chunking response: ${err}`);
  }
  return chunks;
}
