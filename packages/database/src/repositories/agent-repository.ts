import { agent } from "../schemas/agent";

import type { AgentSelect, AgentInsert } from "../schemas/agent";
import type { DatabaseInstance } from "../client";
import { DatabaseError, NotFoundError } from "@packages/errors";
import { eq, or } from "drizzle-orm";

export async function createAgent(
   dbClient: DatabaseInstance,
   data: Omit<AgentInsert, "id" | "createdAt" | "updatedAt">,
): Promise<AgentSelect> {
   try {
      const result = await dbClient.insert(agent).values(data).returning();
      const created = result?.[0];
      if (!created) throw new NotFoundError("Agent not created");
      return created;
   } catch (err) {
      if (err instanceof NotFoundError) throw err;
      throw new DatabaseError(
         `Failed to create agent: ${(err as Error).message}`,
      );
   }
}

export async function getAgentById(
   dbClient: DatabaseInstance,
   id: string,
): Promise<AgentSelect> {
   try {
      const result = await dbClient.query.agent.findFirst({
         where: eq(agent.id, id),
      });
      if (!result) throw new NotFoundError("Agent not found");
      return result;
   } catch (err) {
      if (err instanceof NotFoundError) throw err;
      throw new DatabaseError(`Failed to get agent: ${(err as Error).message}`);
   }
}

export async function updateAgent(
   dbClient: DatabaseInstance,
   id: string,
   data: Partial<AgentInsert>,
): Promise<AgentSelect> {
   try {
      const result = await dbClient
         .update(agent)
         .set(data)
         .where(eq(agent.id, id))
         .returning();
      const updated = result?.[0];
      if (!updated) throw new NotFoundError("Agent not found");
      return updated;
   } catch (err) {
      if (err instanceof NotFoundError) throw err;
      throw new DatabaseError(
         `Failed to update agent: ${(err as Error).message}`,
      );
   }
}

export async function deleteAgent(
   dbClient: DatabaseInstance,
   id: string,
): Promise<void> {
   try {
      const result = await dbClient
         .delete(agent)
         .where(eq(agent.id, id))
         .returning();
      const deleted = result?.[0];
      if (!deleted) throw new NotFoundError("Agent not found");
   } catch (err) {
      if (err instanceof NotFoundError) throw err;
      throw new DatabaseError(
         `Failed to delete agent: ${(err as Error).message}`,
      );
   }
}

export async function listAgents(
   dbClient: DatabaseInstance,
   {
      userId,
      organizationId,
      page = 1,
      limit = 8,
   }: {
      userId?: string;
      organizationId?: string;
      page?: number;
      limit?: number;
   },
): Promise<AgentSelect[]> {
   try {
      const offset = (page - 1) * limit;

      if (userId && organizationId) {
         return await dbClient.query.agent.findMany({
            where: or(
               eq(agent.userId, userId),
               eq(agent.organizationId, organizationId),
            ),
            limit,
            offset,
            orderBy: (agent, { desc }) => [desc(agent.createdAt)],
         });
      }
      if (userId) {
         return await dbClient.query.agent.findMany({
            where: eq(agent.userId, userId),
            limit,
            offset,
            orderBy: (agent, { desc }) => [desc(agent.createdAt)],
         });
      }
      if (organizationId) {
         return await dbClient.query.agent.findMany({
            where: eq(agent.organizationId, organizationId),
            limit,
            offset,
            orderBy: (agent, { desc }) => [desc(agent.createdAt)],
         });
      }
      return [];
   } catch (err) {
      throw new DatabaseError(
         `Failed to list agents: ${(err as Error).message}`,
      );
   }
}

export async function getTotalAgents(
   dbClient: DatabaseInstance,
   { userId, organizationId }: { userId?: string; organizationId?: string },
): Promise<number> {
   try {
      if (userId && organizationId) {
         const result = await dbClient.query.agent.findMany({
            where: or(
               eq(agent.userId, userId),
               eq(agent.organizationId, organizationId),
            ),
         });
         return result.length;
      }
      if (userId) {
         const result = await dbClient.query.agent.findMany({
            where: eq(agent.userId, userId),
         });
         return result.length;
      }
      if (organizationId) {
         const result = await dbClient.query.agent.findMany({
            where: eq(agent.organizationId, organizationId),
         });
         return result.length;
      }
      return 0;
   } catch (err) {
      throw new DatabaseError(
         `Failed to get total agents: ${(err as Error).message}`,
      );
   }
}
