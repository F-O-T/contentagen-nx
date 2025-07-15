import { generateText } from "ai";
import type { OpenRouterClient } from "./client";

type GenerateTextParams = Parameters<typeof generateText>;
export async function generateOpenRouterText(
   client: OpenRouterClient,
   params: GenerateTextParams,
) {
   const result = await generateText({
      ...params,
      //@ts-ignore
      model: client.chat("moonshotai/kimi-k2"),
   });
   return result;
}
