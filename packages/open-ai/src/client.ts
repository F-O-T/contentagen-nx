import OpenAI from "openai";

export function createOpenrouterClient(OPENROUTER_API_KEY: string) {
   const openRouter = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: OPENROUTER_API_KEY,
   });
   return openRouter;
}
export type OpenRouterClient = ReturnType<typeof createOpenrouterClient>;
