import { createTavilyClient } from "@packages/tavily/client";
import { tavilyCrawl } from "@packages/tavily/helpers";
import { serverEnv } from "@packages/environment/server";
import { addBillingWebSearchIngestionJob } from "../../helper-queues/billing-websearch-ingestion-queue";

type CrawlWebsiteForKnowledge = {
   websiteUrl: string;
   userId: string;
};

const tavily = createTavilyClient(serverEnv.TAVILY_API_KEY);
export async function runExternalLinkCuration(
   payload: CrawlWebsiteForKnowledge,
) {
   const { websiteUrl, userId } = payload;

   try {
      const crawResult = await tavilyCrawl(tavily, websiteUrl, {
         autoParameters: true,
         searchDepth: "advanced",
      });
      await addBillingWebSearchIngestionJob({
         method: "crawl",
         userId,
      });

      const { results } = crawResult;
      return { results };
   } catch (error) {
      console.error(
         `Crawl website for knowledge failed for userId=${userId}, websiteUrl="${websiteUrl}".`,
         error,
      );
      throw error;
   }
}
