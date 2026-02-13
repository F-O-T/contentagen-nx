import { createTool } from "@mastra/core/tools";
import { type ProviderId, search } from "@packages/search";
import { AppError } from "@packages/utils/errors";
import { z } from "zod";

export const webSearchTool = createTool({
   id: "web-search",
   description:
      "Searches the web for information relevant to the blog post. Uses multiple providers with automatic fallback.",
   inputSchema: z.object({
      query: z.string().describe("Search query (2-10 words for best results)"),
      maxResults: z
         .number()
         .min(1)
         .max(20)
         .optional()
         .default(5)
         .describe("Maximum number of results to return"),
      searchDepth: z
         .enum(["basic", "advanced"])
         .optional()
         .default("basic")
         .describe(
            "Search depth - 'advanced' for more thorough but slower search",
         ),
      preferredProvider: z
         .enum(["tavily", "exa", "firecrawl"])
         .optional()
         .describe(
            "Preferred search provider (will fallback to others if unavailable)",
         ),
   }),
   outputSchema: z.object({
      results: z.array(
         z.object({
            title: z.string(),
            url: z.string(),
            snippet: z.string(),
            score: z.number().optional(),
         }),
      ),
      provider: z.string(),
      query: z.string(),
   }),
   execute: async (inputData) => {
      const { query, maxResults, searchDepth, preferredProvider } = inputData;

      try {
         const { results, provider } = await search(query, {
            maxResults,
            searchDepth,
            includeAnswer: false,
            includeRawContent: false,
            preferredProvider: preferredProvider as ProviderId | undefined,
         });

         return {
            results: results.map((r) => ({
               title: r.title,
               url: r.url,
               snippet: r.snippet,
               score: r.score,
            })),
            provider,
            query,
         };
      } catch (error) {
         throw AppError.internal(
            `Web search failed: ${(error as Error).message}`,
         );
      }
   },
});
