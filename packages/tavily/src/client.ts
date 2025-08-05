import { tavily } from "@tavily/core";

export const createTavilyClient = (apiKey: string) => {
   const client = tavily({ apiKey });
   return {
      ...client,
      crawl: client.crawl,
   };
};

export type TavilyClient = ReturnType<typeof createTavilyClient>;
