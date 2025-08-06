import { getAgentById } from "@packages/database/repositories/agent-repository";
import { createDb } from "@packages/database/client";
import { serverEnv } from "@packages/environment/server";

const db = createDb({ databaseUrl: serverEnv.DATABASE_URL });

export async function runFetchAgent(payload: { agentId: string }) {
   const { agentId } = payload;
   try {
      const agent = await getAgentById(db, agentId);
      if (!agent) throw new Error("Agent not found");
      return { agent };
   } catch (error) {
      console.error("Error fetching agent:", error);
      throw error;
   }
}
