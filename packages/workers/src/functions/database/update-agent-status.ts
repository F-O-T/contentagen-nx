import { createDb } from "@packages/database/client";
import { serverEnv } from "@packages/environment/server";
import { updateAgent } from "@packages/database/repositories/agent-repository";
import { emitAgentKnowledgeStatusChanged } from "@packages/server-events";
import type { BrandKnowledgeStatus } from "@packages/database/schemas/agent";

const db = createDb({ databaseUrl: serverEnv.DATABASE_URL });

export async function updateAgentKnowledgeStatus(
   agentId: string,
   status: BrandKnowledgeStatus,
   message?: string,
) {
   try {
      await updateAgent(db, agentId, { brandKnowledgeStatus: status });
   } catch (err) {
      // If DB update fails, still emit event so UI can update
      console.error(
         "[BrandKnowledge] Failed to update agent status in DB:",
         err,
      );
   }
   emitAgentKnowledgeStatusChanged({ agentId, status, message });
}
