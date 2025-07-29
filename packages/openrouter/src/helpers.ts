import { generateText } from "ai";
import type { OpenRouterClient } from "./client";

type GenerateTextParams = Parameters<typeof generateText>[0];
export async function generateOpenRouterText(
   client: OpenRouterClient,
   params: Omit<GenerateTextParams, "model">,
) {
   const result = await generateText({
      ...params,
      model: client.chat("google/gemini-2.5-flash"),
   });
   return result;
}
