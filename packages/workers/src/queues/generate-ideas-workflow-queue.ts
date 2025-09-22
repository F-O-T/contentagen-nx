import { Worker, Queue, type Job } from "bullmq";
import { serverEnv } from "@packages/environment/server";
import { createRedisClient } from "@packages/redis";
import { registerGracefulShutdown } from "../../helpers";
import { mastra } from "@packages/mastra";
import type { PersonaConfig } from "@packages/database/schema";

export interface GenerateIdeasWorkflowJobData {
  agentId: string;
  keywords: string[];
  userId: string;
  language?: "en" | "pt";
  personaConfig?: PersonaConfig;
}

export interface GenerateIdeasWorkflowJobResult {
  agentId: string;
  keywords: string[];
  ideaIds: string[];
  totalIdeas: number;
}

export async function runGenerateIdeasWorkflow(
  payload: GenerateIdeasWorkflowJobData,
): Promise<GenerateIdeasWorkflowJobResult> {
  const { agentId, keywords, userId, language = "en" } = payload;

  try {
    console.log(
      `[GenerateIdeasWorkflow] Starting workflow for agent ${agentId} with keywords: ${keywords.join(", ")}`,
    );

    // Execute the workflow
    const result = await mastra.workflows.generateIdeasWorkflow.execute({
      inputData: {
        agentId,
        keywords,
        userId,
        language,
      },
    });

    console.log(
      `[GenerateIdeasWorkflow] Successfully generated ${result.totalIdeas} ideas for agent ${agentId}`,
    );

    return {
      agentId,
      keywords,
      ideaIds: result.ideaIds,
      totalIdeas: result.totalIdeas,
    };
  } catch (error) {
    console.error("[GenerateIdeasWorkflow] PIPELINE ERROR", {
      agentId,
      keywords,
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error && error.stack ? error.stack : undefined,
    });

    throw error;
  }
}

const QUEUE_NAME = "generate-ideas-workflow";
const redis = createRedisClient(serverEnv.REDIS_URL);

export const generateIdeasWorkflowQueue = new Queue<GenerateIdeasWorkflowJobData>(
  QUEUE_NAME,
  {
    connection: redis,
  },
);
registerGracefulShutdown(generateIdeasWorkflowQueue);

export async function enqueueGenerateIdeasWorkflowJob(
  data: GenerateIdeasWorkflowJobData,
  jobOptions?: Parameters<Queue<GenerateIdeasWorkflowJobData>["add"]>[2],
) {
  return generateIdeasWorkflowQueue.add(QUEUE_NAME, data, jobOptions);
}

export const generateIdeasWorkflowWorker = new Worker<GenerateIdeasWorkflowJobData>(
  QUEUE_NAME,
  async (job: Job<GenerateIdeasWorkflowJobData>) => {
    await runGenerateIdeasWorkflow(job.data);
  },
  {
    connection: redis,
    removeOnComplete: {
      count: 10,
    },
  },
);
registerGracefulShutdown(generateIdeasWorkflowWorker);