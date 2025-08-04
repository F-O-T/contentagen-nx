import { content } from "../schemas/content";
import type { Content, ContentInsert } from "../schemas/content";
import type { DatabaseInstance } from "../client";
import { DatabaseError, NotFoundError } from "@packages/errors";
import { eq } from "drizzle-orm";

export async function createContent(
   dbClient: DatabaseInstance,
   data: ContentInsert,
): Promise<Content> {
   try {
      const result = await dbClient.insert(content).values(data).returning();
      const created = result?.[0];
      if (!created) throw new NotFoundError("Content not created");
      return created;
   } catch (err) {
      if (err instanceof NotFoundError) throw err;
      throw new DatabaseError(
         `Failed to create content: ${(err as Error).message}`,
      );
   }
}

export async function getContentById(
   dbClient: DatabaseInstance,
   id: string,
): Promise<Content> {
   try {
      const result = await dbClient.query.content.findFirst({
         where: eq(content.id, id),
      });
      if (!result) throw new NotFoundError("Content not found");
      return result;
   } catch (err) {
      if (err instanceof NotFoundError) throw err;
      throw new DatabaseError(
         `Failed to get content: ${(err as Error).message}`,
      );
   }
}

export async function updateContent(
   dbClient: DatabaseInstance,
   id: string,
   data: Partial<ContentInsert>,
): Promise<Content> {
   try {
      const result = await dbClient
         .update(content)
         .set(data)
         .where(eq(content.id, id))
         .returning();
      const updated = result?.[0];
      if (!updated) throw new NotFoundError("Content not found");
      return updated;
   } catch (err) {
      if (err instanceof NotFoundError) throw err;
      throw new DatabaseError(
         `Failed to update content: ${(err as Error).message}`,
      );
   }
}

export async function deleteContent(
   dbClient: DatabaseInstance,
   id: string,
): Promise<void> {
   try {
      const result = await dbClient
         .delete(content)
         .where(eq(content.id, id))
         .returning();
      const deleted = result?.[0];
      if (!deleted) throw new NotFoundError("Content not found");
   } catch (err) {
      if (err instanceof NotFoundError) throw err;
      throw new DatabaseError(
         `Failed to delete content: ${(err as Error).message}`,
      );
   }
}

export async function listContents(
   dbClient: DatabaseInstance,
   agentId: string,
): Promise<Content[]> {
   try {
      return await dbClient.query.content.findMany({
         where: eq(content.agentId, agentId),
      });
   } catch (err) {
      throw new DatabaseError(
         `Failed to list contents: ${(err as Error).message}`,
      );
   }
}
