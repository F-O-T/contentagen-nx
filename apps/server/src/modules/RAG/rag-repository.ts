import { db } from "@api/integrations/database";
import {
   knowledgeChunk,
   type KnowledgeChunkSelect,
   type KnowledgeSource,
} from "@api/schemas/agent-schema";
import { eq, and, sql, desc, gt, cosineDistance } from "drizzle-orm";

export async function getChunksByAgent(agentId: string) {
   const chunks = db.query.knowledgeChunk.findMany({
      where: eq(knowledgeChunk.agentId, agentId),
   });
   return chunks;
}

export async function addChunk(
   data: Omit<KnowledgeChunkSelect, "id" | "createdAt" | "updatedAt">,
) {
   const [created] = await db.insert(knowledgeChunk).values(data).returning();
   if (!created) throw new Error("Failed to create knowledge chunk");
   return created;
}

export async function updateChunk(
   chunkId: string,
   fields: Partial<Omit<KnowledgeChunkSelect, "createdAt" | "updatedAt">>,
) {
   const [updated] = await db
      .update(knowledgeChunk)
      .set({ ...fields, updatedAt: new Date() })
      .where(eq(knowledgeChunk.id, chunkId))
      .returning();
   if (!updated) throw new Error("Failed to update knowledge chunk");
   return updated;
}

export async function deleteChunk(chunkId: string): Promise<void> {
   const deleted = await db
      .delete(knowledgeChunk)
      .where(eq(knowledgeChunk.id, chunkId));
   if (!deleted) throw new Error("Failed to delete knowledge chunk");
}

export async function findChunksBySource(
   embedding: number[],
   params: { agentId: string; source: KnowledgeSource },
) {
   const similarity = sql<number>`1 - (${cosineDistance(knowledgeChunk.embedding, embedding)})`;
   const chunks = await db
      .select({ knowledgeChunk, similarity })
      .from(knowledgeChunk)
      .where(
         and(
            eq(knowledgeChunk.agentId, params.agentId),
            eq(knowledgeChunk.source, params.source),
            gt(similarity, 0.5),
         ),
      )
      .orderBy((t) => desc(t.similarity))
      .limit(10);

   return chunks;
}
