import { Worker, Queue, type Job } from "bullmq";
import { serverEnv } from "@packages/environment/server";
import { createRedisClient } from "@packages/redis";
import { registerGracefulShutdown } from "../helpers";

export interface IdeaGenerationJobData {
   agentId: string;
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
import { runGenerateIdea } from "../functions/writing/generate-idea";
import { runExternalLinkCuration } from "../functions/web-search/external-link-curation";

import { runGetAgent } from "../functions/database/get-agent";
import { runGetContentKeywords } from "../functions/chunking/get-content-keywords";

export const ideaGenerationWorker = new Worker<IdeaGenerationJobData>(
   QUEUE_NAME,
   async (job: Job<IdeaGenerationJobData>) => {
      const { agentId } = job.data;
      try {
         // 1. Fetch agent info
         const { agent } = await runGetAgent({ agentId });
         const userId = agent.userId;

         // 2. Find relevant keywords for the agent via web search
         const brandQuery =
            agent.personaConfig.metadata.description ||
            agent.personaConfig.metadata.name ||
            "blog";
         const webSearchRes = await runExternalLinkCuration({
            query: brandQuery,
            userId,
         });
         const webContents = webSearchRes.results
            .map((r) => r.content)
            .join("\n");

         // Extract keywords from web search results
         let keywordsResult = await runGetContentKeywords({
            inputText: webContents,
            userId,
         });
         let keywords = keywordsResult.keywords;
         if (!keywords || keywords.length === 0) {
            keywords = [brandQuery]; // fallback to brand description/name
         }

         // 3. RAG search with extracted keywords
         const ragResult = await runRagByKeywords({ agentId, keywords });
         const brandContext = ragResult.chunks.join("\n");

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
         const idea = await runGenerateIdea({
            brandContext,
            webSnippets,
            keywords,
         });

         // Log or persist result
         console.log({
            agentId,
            idea,
            brandContext,
            sources,
            keywords,
            createdAt: new Date().toISOString(),
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
