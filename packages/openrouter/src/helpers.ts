import { generateText } from "ai";
import type { OpenRouterClient } from "./client";
export const MODELS = {
   small: "google/gemini-2.5-flash-lite",
   medium: "google/gemini-2.5-flash",
};
export const REASONING_EFFORT = {
   low: 2048,
   medium: 4096,
   high: 8192,
};
type reasoningEffort = "low" | "medium" | "high";

type GenerateTextParams = Parameters<typeof generateText>[0];
export async function generateOpenRouterText(
   client: OpenRouterClient,
   lllmConfig: {
      model: keyof typeof MODELS;
      reasoning?: reasoningEffort;
   },
   params: Omit<GenerateTextParams, "model">,
) {
   const { model, reasoning } = lllmConfig;
   const result = await generateText({
      ...params,
      model: client.languageModel(client.chat(MODELS[model]).modelId, {
         reasoning: {
            max_tokens: reasoning ? REASONING_EFFORT[reasoning] : 0,
            enabled: Boolean(reasoning),
         },
      }),
   });
   return result;
}
