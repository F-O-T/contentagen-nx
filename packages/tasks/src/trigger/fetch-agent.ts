import { task, logger } from "@trigger.dev/sdk/v3";
import { getAgentById } from "@packages/database/repositories/agent-repository";
import { createDb } from "@packages/database/client";
import { serverEnv } from "@packages/environment/server";

const db = createDb({ databaseUrl: serverEnv.DATABASE_URL });

export async function runFetchAgent(payload: { agentId: string }) {
   const { agentId } = payload;
   try {
      logger.info("Fetching agent", { agentId });
      const agent = await getAgentById(db, agentId);
      if (!agent) throw new Error("Agent not found");
      return { agent };
   } catch (error) {
      logger.error("Error in fetch agent task", {
         error: error instanceof Error ? error.message : error,
      });
      throw error;
   }
}

export const fetchAgentTask = task({
   id: "fetch-agent-job",
   run: runFetchAgent,
});
