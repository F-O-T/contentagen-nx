import { createTavilyClient } from "@packages/tavily/client";
import { tavilyCrawl } from "@packages/tavily/helpers";
import { serverEnv } from "@packages/environment/server";
import { enqueueBillingWebSearchIngestionJob } from "../../queues/billing-websearch-ingestion-queue";

type CrawlCompetitorWebsite = {
   websiteUrl: string;
   userId: string;
};

const tavily = createTavilyClient(serverEnv.TAVILY_API_KEY);

export async function runCrawlCompetitorWebsite(
   payload: CrawlCompetitorWebsite,
) {
   const { websiteUrl, userId } = payload;

   try {
      const crawlResult = await tavilyCrawl(tavily, websiteUrl, {
         autoParameters: true,
         searchDepth: "advanced",
         instructions:
            "Extract all information relevent to the features present in this app",
      });

      await enqueueBillingWebSearchIngestionJob({
         method: "crawl",
         userId,
      });

      const { results } = crawlResult;
      return { results };
   } catch (error) {
      console.error(
         `Crawl competitor website failed for userId=${userId}, websiteUrl="${websiteUrl}".`,
         error,
      );
      throw error;
   }
}
