import { createTool } from "@mastra/core/tools";
import {
   createWebSearchUsageMetadata,
   ingestBilling,
} from "@packages/payment/ingestion";
import { getPaymentClient } from "@packages/payment/client";
import { z } from "zod";
import { serverEnv } from "@packages/environment/server";
import { tavily } from "@tavily/core";
import { AppError, propagateError } from "@packages/utils/errors";

export function getTavilyCrawlInstructions(): string {
   return `
## TAVILY CRAWL TOOL
Extracts content from a website (crawls up to 2 levels deep).

**When to use:** Extract comprehensive information from a specific URL

**Parameters:**
- websiteUrl (string): Full URL with https://
- instructions (string): What to extract (max 400 chars, be specific)

**Example:**
websiteUrl: "https://stripe.com/docs"
instructions: "Extract API endpoints, authentication methods, and integration features"
`;
}

export const tavilyCrawlTool = createTool({
   id: "tavily-crawl",
   description: "Crawls a website url to extract knowledge and content",
   inputSchema: z.object({
      websiteUrl: z.url().describe("The website URL to crawl"),
      instructions: z
         .string()
         .describe(
            "Natural language instructions for the crawler to follow when crawling the website (max 400 characters)",
         ),
   }),
   execute: async ({ context, runtimeContext }) => {
      const { websiteUrl } = context;

      if (!runtimeContext.has("userId")) {
         throw AppError.internal("User ID is required in runtime context");
      }
      const userId = runtimeContext.get("userId") as string;

      try {
         const tavilyClient = tavily({ apiKey: serverEnv.TAVILY_API_KEY });
         const polarClient = getPaymentClient(serverEnv.POLAR_ACCESS_TOKEN);

         const truncatedInstructions = context.instructions.slice(0, 400);

         const crawResult = await tavilyClient.crawl(websiteUrl, {
            maxDepth: 2,
            instructions: truncatedInstructions,
         });
         const usageData = createWebSearchUsageMetadata({
            method: "crawl",
         });
         await ingestBilling(polarClient, {
            externalCustomerId: userId,
            metadata: usageData,
         });
         const { results } = crawResult;
         return { results };
      } catch (error) {
         console.error(
            `Brand crawl failed for userId=${userId}, websiteUrl="${websiteUrl}".`,
            error,
         );
         propagateError(error);
         throw AppError.internal(
            `Crawl failed for userId=${userId}, websiteUrl="${websiteUrl}": ${(error as Error).message}`,
         );
      }
   },
});
