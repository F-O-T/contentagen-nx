import { generateText } from "ai";
import type { OpenRouterClient } from "./client";

type GenerateTextParams = Parameters<typeof generateText>[0];
export async function generateOpenRouterText(
   client: OpenRouterClient,
   params: Omit<GenerateTextParams, "model">,
) {
   const result = await generateText({
      ...params,
      model: client.chat(
         "moonshotai/kimi-k2",
      ) as unknown as GenerateTextParams["model"],
   });
   return result;
}
