import type { TavilyClient } from "./client";

export interface TavilySearchOptions {
   maxResults?: number;
   includeAnswer?: boolean;
   searchDepth?: "basic" | "advanced";
   topic?: "general" | "news";
}

export const tavilySearch = async (
   client: TavilyClient,
   query: string,
   options?: TavilySearchOptions,
) => {
   return await client.search(query, {
      max_results: options?.maxResults ?? 5,
      include_answer: options?.includeAnswer ?? true,
      search_depth: options?.searchDepth ?? "basic",
      topic: options?.topic ?? "general",
   });
};
