import { generateObject, generateText } from "ai";
import { ZodObject } from "zod";
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
type GenerateObjectParams = Parameters<typeof generateObject>[0];
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
      model: client.chat(MODELS[model], {
         reasoning: {
            max_tokens: reasoning ? REASONING_EFFORT[reasoning] : 0,
            enabled: Boolean(reasoning),
         },
      }),
   });
   return result;
}
export async function generateOpenRouterObject(
   client: OpenRouterClient,
   lllmConfig: {
      model: keyof typeof MODELS;
      reasoning?: reasoningEffort;
   },
   schema: ZodObject,
   params: Omit<GenerateObjectParams, "model" | "schema">,
) {
   const { model, reasoning } = lllmConfig;
   const result = await generateObject({
      ...params,
      schema,

      model: client.chat(MODELS[model], {
         reasoning: {
            max_tokens: reasoning ? REASONING_EFFORT[reasoning] : 0,
            enabled: Boolean(reasoning),
         },
      }),
   });
   return result;
}
