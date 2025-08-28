import { memory } from "../schemas/memories";

import type {
   MemorySelect,
   MemoryInsert,
   MemoryType,
   MemoryContent,
} from "../schemas/memories";
import type { DatabaseInstance } from "../client";
import { DatabaseError, NotFoundError } from "@packages/errors";
import { eq, and, desc } from "drizzle-orm";

export async function createMemory(
   dbClient: DatabaseInstance,
   data: Omit<MemoryInsert, "id" | "createdAt" | "updatedAt">,
): Promise<MemorySelect> {
   try {
      const result = await dbClient.insert(memory).values(data).returning();
      const created = result?.[0];
      if (!created) throw new NotFoundError("Memory not created");
      return created;
   } catch (err) {
      if (err instanceof NotFoundError) throw err;
      throw new DatabaseError(
         `Failed to create memory: ${(err as Error).message}`,
      );
   }
}

export async function getMemoryById(
   dbClient: DatabaseInstance,
   id: string,
): Promise<MemorySelect> {
   try {
      const result = await dbClient.query.memory.findFirst({
         where: eq(memory.id, id),
      });
      if (!result) throw new NotFoundError("Memory not found");
      return result;
   } catch (err) {
      if (err instanceof NotFoundError) throw err;
      throw new DatabaseError(
         `Failed to get memory: ${(err as Error).message}`,
      );
   }
}

export async function updateMemory(
   dbClient: DatabaseInstance,
   id: string,
   data: Partial<MemoryInsert>,
): Promise<MemorySelect> {
   try {
      const result = await dbClient
         .update(memory)
         .set(data)
         .where(eq(memory.id, id))
         .returning();
      const updated = result?.[0];
      if (!updated) throw new NotFoundError("Memory not found");
      return updated;
   } catch (err) {
      if (err instanceof NotFoundError) throw err;
      throw new DatabaseError(
         `Failed to update memory: ${(err as Error).message}`,
      );
   }
}

export async function deleteMemory(
   dbClient: DatabaseInstance,
   id: string,
): Promise<void> {
   try {
      const result = await dbClient
         .delete(memory)
         .where(eq(memory.id, id))
         .returning();
      const deleted = result?.[0];
      if (!deleted) throw new NotFoundError("Memory not found");
   } catch (err) {
      if (err instanceof NotFoundError) throw err;
      throw new DatabaseError(
         `Failed to delete memory: ${(err as Error).message}`,
      );
   }
}

export async function listMemories(
   dbClient: DatabaseInstance,
   {
      userId,
      agentId,
      type,
      isActive = true,
      limit = 50,
   }: {
      userId?: string;
      agentId?: string;
      type?: MemoryType;
      isActive?: boolean;
      limit?: number;
   },
): Promise<MemorySelect[]> {
   try {
      const conditions = [];

      if (userId) conditions.push(eq(memory.userId, userId));
      if (agentId) conditions.push(eq(memory.agentId, agentId));
      if (type) conditions.push(eq(memory.type, type));
      if (isActive !== undefined)
         conditions.push(eq(memory.isActive, isActive));

      const whereClause =
         conditions.length > 0 ? and(...conditions) : undefined;

      return await dbClient.query.memory.findMany({
         where: whereClause,
         orderBy: desc(memory.createdAt),
         limit,
      });
   } catch (err) {
      throw new DatabaseError(
         `Failed to list memories: ${(err as Error).message}`,
      );
   }
}

export async function getMemoriesByAgent(
   dbClient: DatabaseInstance,
   agentId: string,
   limit = 20,
): Promise<MemorySelect[]> {
   try {
      return await dbClient.query.memory.findMany({
         where: and(eq(memory.agentId, agentId), eq(memory.isActive, true)),
         orderBy: desc(memory.createdAt),
         limit,
      });
   } catch (err) {
      throw new DatabaseError(
         `Failed to get memories by agent: ${(err as Error).message}`,
      );
   }
}

export async function getMemoriesByType(
   dbClient: DatabaseInstance,
   agentId: string,
   type: MemoryType,
   limit = 10,
): Promise<MemorySelect[]> {
   try {
      return await dbClient.query.memory.findMany({
         where: and(
            eq(memory.agentId, agentId),
            eq(memory.type, type),
            eq(memory.isActive, true),
         ),
         orderBy: desc(memory.createdAt),
         limit,
      });
   } catch (err) {
      throw new DatabaseError(
         `Failed to get memories by type: ${(err as Error).message}`,
      );
   }
}

export async function getHighImportanceMemories(
   dbClient: DatabaseInstance,
   agentId: string,
   minImportance = 7,
   limit = 15,
): Promise<MemorySelect[]> {
   try {
      // This would require a more complex query to filter by JSON content
      // For now, return recent memories and filter in application code
      const memories = await getMemoriesByAgent(dbClient, agentId, limit * 2);
      return memories
         .filter((memory) => {
            const content = memory.content as MemoryContent;
            return content.importance && content.importance >= minImportance;
         })
         .slice(0, limit);
   } catch (err) {
      throw new DatabaseError(
         `Failed to get high importance memories: ${(err as Error).message}`,
      );
   }
}

export async function getMemoriesByTags(
   dbClient: DatabaseInstance,
   agentId: string,
   tags: string[],
   limit = 20,
): Promise<MemorySelect[]> {
   try {
      const memories = await getMemoriesByAgent(dbClient, agentId, limit * 3);
      return memories
         .filter((memory) => {
            const content = memory.content as MemoryContent;
            if (!content.tags) return false;
            return tags.some((tag) => content.tags!.includes(tag));
         })
         .slice(0, limit);
   } catch (err) {
      throw new DatabaseError(
         `Failed to get memories by tags: ${(err as Error).message}`,
      );
   }
}

export async function deactivateExpiredMemories(
   dbClient: DatabaseInstance,
): Promise<number> {
   try {
      const result = await dbClient
         .update(memory)
         .set({ isActive: false })
         .where(
            and(
               eq(memory.isActive, true),
               // Add expiration logic here if needed
            ),
         )
         .returning();

      return result.length;
   } catch (err) {
      throw new DatabaseError(
         `Failed to deactivate expired memories: ${(err as Error).message}`,
      );
   }
}
