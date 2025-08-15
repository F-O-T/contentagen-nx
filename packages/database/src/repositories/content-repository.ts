import { content } from "../schemas/content";
import { inArray } from "drizzle-orm";

import type {
   ContentSelect as Content,
   ContentInsert,
} from "../schemas/content";
import type { DatabaseInstance } from "../client";
import { DatabaseError, NotFoundError } from "@packages/errors";
import { eq } from "drizzle-orm";

// Get content by slug
export async function getContentBySlug(
   dbClient: DatabaseInstance,
   slug: string,
): Promise<Content> {
   try {
      // Find by meta.slug with SQL JSON extraction
      const result = await dbClient.query.content.findFirst({
         where: (fields, { sql }) => sql`${fields.meta}->>'slug' = ${slug}`,
      });
      if (!result) throw new NotFoundError("Content not found");
      return result;
   } catch (err) {
      if (err instanceof NotFoundError) throw err;
      throw new DatabaseError(
         `Failed to get content by slug: ${(err as Error).message}`,
      );
   }
}

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
   status: Array<Exclude<Content["status"], null>>,
): Promise<
   Pick<
      Content,
      "id" | "createdAt" | "stats" | "meta" | "imageUrl" | "status"
   >[]
> {
   try {
      return await dbClient.query.content.findMany({
         where: (_fields, operators) =>
            operators.and(
               eq(content.agentId, agentId),
               inArray(content.status, status),
            ),
         columns: {
            id: true,
            meta: true,
            imageUrl: true,
            status: true,
            createdAt: true,
            stats: true,
         },
         orderBy: (content, { desc }) => [desc(content.updatedAt)],
      });
   } catch (err) {
      throw new DatabaseError(
         `Failed to list contents: ${(err as Error).message}`,
      );
   }
}

export async function getAgentContentStats(
   dbClient: DatabaseInstance,
   agentId: string,
): Promise<Content[]> {
   try {
      return await dbClient.query.content.findMany({
         where: eq(content.agentId, agentId),
         orderBy: (content, { desc }) => [desc(content.updatedAt)],
      });
   } catch (err) {
      throw new DatabaseError(
         `Failed to get agent content stats: ${(err as Error).message}`,
      );
   }
}
