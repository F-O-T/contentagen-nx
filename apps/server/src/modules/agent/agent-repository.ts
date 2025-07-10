import { db } from "@api/integrations/database";
import { agent, type AgentInsert } from "@api/schemas/agent-schema";
import { eq } from "drizzle-orm";

export async function getAgentById(agentId: string) {
   const found = await db.query.agent.findFirst({
      where: eq(agent.id, agentId),
   });
   if (!found) throw new Error("Agent not found");
   return found;
}

export async function getAgentsByUserId(userId: string) {
   const found = await db.query.agent.findMany({
      where: eq(agent.userId, userId),
   });
   if (!found || found.length === 0)
      throw new Error("No agents found for user");
   return found;
}

export async function addAgent(
   data: Omit<AgentInsert, "id" | "createdAt" | "updatedAt">,
) {
   const [created] = await db.insert(agent).values(data).returning();
   if (!created) throw new Error("Failed to create agent");
   return created;
}

export async function updateAgent(
   agentId: string,
   fields: Partial<Omit<AgentInsert, "createdAt" | "updatedAt">>,
) {
   const [updated] = await db
      .update(agent)
      .set({ ...fields, updatedAt: new Date() })
      .where(eq(agent.id, agentId))
      .returning();
   if (!updated) throw new Error("Failed to update agent");
   return updated;
}

export async function deleteAgent(agentId: string): Promise<void> {
   const deleted = await db.delete(agent).where(eq(agent.id, agentId));
   if (!deleted) throw new Error("Failed to delete agent");
   return;
}
