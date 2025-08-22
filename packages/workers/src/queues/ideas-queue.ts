import { Worker, Queue, type Job } from "bullmq";
import { serverEnv } from "@packages/environment/server";
import { createRedisClient } from "@packages/redis";
import { registerGracefulShutdown } from "../helpers";

export interface IdeaGenerationJobData {
   agentId: string;
   createdAt: number;
}

const QUEUE_NAME = "idea-generation-workflow";
const redis = createRedisClient(serverEnv.REDIS_URL);

export const ideaGenerationQueue = new Queue<IdeaGenerationJobData>(
   QUEUE_NAME,
   {
      connection: redis,
   },
);
registerGracefulShutdown(ideaGenerationQueue);

export async function enqueueIdeaGenerationJob(
   data: IdeaGenerationJobData,
   jobOptions?: Parameters<Queue<IdeaGenerationJobData>["add"]>[2],
) {
   return ideaGenerationQueue.add(QUEUE_NAME, data, jobOptions);
}

import { runRagByKeywords } from "../functions/rag/brand-knowledge-rag-by-keywords";
import { generateIdeaWithLLM } from "../functions/writing/generate-idea";
import { runExternalLinkCuration } from "../functions/web-search/external-link-curation";

import { runGetAgent } from "../functions/database/get-agent";
import { runGetContentKeywords } from "../functions/chunking/get-content-keywords";

export const ideaGenerationWorker = new Worker<IdeaGenerationJobData>(
   QUEUE_NAME,
   async (job: Job<IdeaGenerationJobData>) => {
      const { agentId, createdAt } = job.data;
      try {
         // 1. Fetch agent info
         const { agent } = await runGetAgent({ agentId });
         const userId = agent.userId;

         // 2. Get brand context (RAG)
         const ragResult = await runRagByKeywords({ agentId, keywords: [] });
         const brandContext = ragResult.chunks.join("\n");

         // 3. Generate keywords/topics
         const keywordsResult = await runGetContentKeywords({
            inputText: brandContext,
            userId,
         });
         const keywords = keywordsResult.keywords;

         // 4. Tavily web search for each keyword
         const webResults = await Promise.all(
            keywords.map(async (query) => {
               const res = await runExternalLinkCuration({ query, userId });
               return res?.results || [];
            }),
         );
         const sources = webResults.flat().map((r) => r.url);
         const webSnippets = webResults
            .flat()
            .map((r) => r.content)
            .join("\n");

         // 5. Generate idea (LLM)
         const idea = await generateIdeaWithLLM({
            brandContext,
            webSnippets,
            searchQueries: keywords,
         });

         // Log or persist result
         console.log({
            agentId,
            idea,
            brandContext,
            sources,
            keywords,
            createdAt,
            status: "done",
            updatedAt: Date.now(),
         });
      } catch (error) {
         console.error("[IdeaGenerationWorker] Error:", error);
      }
   },
   {
      connection: redis,
      removeOnComplete: {
         count: 10,
      },
   },
);
registerGracefulShutdown(ideaGenerationWorker);
