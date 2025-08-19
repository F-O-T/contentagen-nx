import type { TavilyClient } from "./client";

type TavilySearchOptions = Parameters<TavilyClient["search"]>[1];
type TavilyCrawlOptions = Parameters<TavilyClient["crawl"]>[1];
export const tavilyCrawl = async (
   client: TavilyClient,
   url: string,
   options?: TavilyCrawlOptions,
) => {
   return await client.crawl(url, options);
};
export const tavilySearch = async (
   client: TavilyClient,
   query: string,
   options?: TavilySearchOptions,
) => {
   return await client.search(query, options);
};
