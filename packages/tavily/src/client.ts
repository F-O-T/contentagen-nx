import { tavily } from "@tavily/core";

export const createTavilyClient = (apiKey: string) => {
   return tavily({ apiKey });
};

export type TavilyClient = ReturnType<typeof createTavilyClient>;
