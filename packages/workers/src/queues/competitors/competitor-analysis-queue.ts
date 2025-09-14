import { Worker, Queue, type Job } from "bullmq";
import { serverEnv } from "@packages/environment/server";
import { createRedisClient } from "@packages/redis";
import { registerGracefulShutdown } from "../../helpers";
import { runAnalyzeCompetitorFeatures } from "../../functions/analysis/analyze-competitor-features";
import { runSaveCompetitorFeatures } from "../../functions/database/save-competitor-features";
import { updateCompetitorStatus } from "../../functions/database/update-competitor-status";

export type CompetitorAnalysisJob = {
   competitorId: string;
   userId: string;
   organizationId: string;
   websiteUrl: string;
   crawlResults: Array<{ rawContent: string; url: string }>;
};

const QUEUE_NAME = "competitor-analysis";
const redis = createRedisClient(serverEnv.REDIS_URL);

export const competitorAnalysisQueue = new Queue<CompetitorAnalysisJob>(
   QUEUE_NAME,
   {
      connection: redis,
   },
);
registerGracefulShutdown(competitorAnalysisQueue);

export async function enqueueCompetitorAnalysisJob(job: CompetitorAnalysisJob) {
   return competitorAnalysisQueue.add(QUEUE_NAME, job);
}

export const competitorAnalysisWorker = new Worker<CompetitorAnalysisJob>(
   QUEUE_NAME,
   async (job: Job<CompetitorAnalysisJob>) => {
      const { competitorId, userId, websiteUrl, crawlResults } = job.data;

      try {
         // Update status to analyzing
         await updateCompetitorStatus({
            competitorId,
            status: "analyzing",
         });

         const { features } = await runAnalyzeCompetitorFeatures({
            userId,
            websiteData: crawlResults.map((r) => r.rawContent).join("\n\n"),
         });

         await runSaveCompetitorFeatures({
            competitorId,
            features: features.map((feature) => ({
               competitorId,
               featureName: feature.name,
               summary: feature.summary,
               rawContent: feature.rawContent,
               sourceUrl: feature.sourceUrl || websiteUrl,
               meta: {
                  confidence: feature.confidence,
                  category: feature.category,
                  tags: feature.tags,
               },
            })),
         });

         // Update status to completed
         await updateCompetitorStatus({
            competitorId,
            status: "completed",
         });
      } catch (error) {
         // Update status to failed on error
         await updateCompetitorStatus({
            competitorId,
            status: "failed",
         });
         throw error;
      }
   },
   { connection: redis, removeOnComplete: { count: 10 } },
);
registerGracefulShutdown(competitorAnalysisWorker);
