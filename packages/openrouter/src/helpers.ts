import { generateObject, generateText } from "ai";
import type { ZodObject } from "zod";
import type { OpenRouterClient } from "./client";

export const MODELS = {
   small: "deepseek/deepseek-chat-v3.1",
};

type GenerateTextParams = Parameters<typeof generateText>[0];
type GenerateObjectParams = Parameters<typeof generateObject>[0];
export async function generateOpenRouterText(
   client: OpenRouterClient,
   lllmConfig: {
      model: keyof typeof MODELS;
   },
   params: Omit<GenerateTextParams, "model">,
) {
   const { model } = lllmConfig;
   const result = await generateText({
      ...params,
      model: client(MODELS[model], {
         usage: {
            include: true,
         },
      }),
   });
   return result;
}
export async function generateOpenRouterObject(
   client: OpenRouterClient,
   lllmConfig: {
      model: keyof typeof MODELS;
   },
   schema: ZodObject,
   params: Omit<GenerateObjectParams, "model" | "schema">,
) {
   const { model } = lllmConfig;
   const result = await generateObject({
      ...params,
      schema,

      model: client(MODELS[model], {
         usage: {
            include: true,
         },
      }),
   });
   return result;
}
