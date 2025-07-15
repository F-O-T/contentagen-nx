import type { OpenRouterClient } from "./client";
import type { ChatCompletionCreateParams } from "openai/resources/chat/completions";

export async function getCompletion(
   client: OpenRouterClient,
   params: ChatCompletionCreateParams,
) {
   return await client.chat.completions.create(params);
}
