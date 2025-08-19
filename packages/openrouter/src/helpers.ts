import { generateObject, generateText } from "ai";
import type { ZodObject } from "zod";
import type { OpenRouterClient } from "./client";

export const NANO_MODELS = {
   qwen: "qwen/qwen3-30b-a3b-instruct-2507",
   gemini: "google/gemini-2.5-flash-lite",
   glm: "z-ai/glm-4.5-air",
};

export const SMALL_MODELS = {
   qwen: "qwen/qwen3-235b-a22b-2507",
   gemini: "google/gemini-2.5-flash",
   glm: "z-ai/glm-4.5",
};
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
      model: client(MODELS[model], {
         usage: {
            include: true,
         },
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

      model: client(MODELS[model], {
         usage: {
            include: true,
         },
         reasoning: {
            max_tokens: reasoning ? REASONING_EFFORT[reasoning] : 0,
            enabled: Boolean(reasoning),
         },
      }),
   });
   return result;
}
