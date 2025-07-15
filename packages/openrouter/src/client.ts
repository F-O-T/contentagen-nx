import { createOpenRouter } from "@openrouter/ai-sdk-provider";

export function createOpenrouterClient(apiKey: string) {
   const openrouter = createOpenRouter({ apiKey });
   return openrouter;
}

export type OpenRouterClient = ReturnType<typeof createOpenrouterClient>;
