//TODO: Once everything is fully migrated to the mastra package, we can remove this internal package
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

export function createOpenrouterClient(apiKey: string) {
   const openrouter = createOpenRouter({ apiKey });
   return openrouter;
}

export type OpenRouterClient = ReturnType<typeof createOpenrouterClient>;
