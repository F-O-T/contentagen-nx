import { contentVersion } from "../schemas/content-version";
import { content } from "../schemas/content";
import { eq, desc, and } from "drizzle-orm";

import type {
   ContentVersionSelect as ContentVersion,
   ContentVersionInsert,
} from "../schemas/content-version";
import type { DatabaseInstance } from "../client";
import { DatabaseError, NotFoundError } from "@packages/errors";

export async function createContentVersion(
   dbClient: DatabaseInstance,
   data: ContentVersionInsert,
): Promise<ContentVersion> {
   try {
      const result = await dbClient
         .insert(contentVersion)
         .values(data)
         .returning();
      const created = result?.[0];
      if (!created) throw new NotFoundError("Content version not created");
      return created;
   } catch (err) {
      if (err instanceof NotFoundError) throw err;
      throw new DatabaseError(
         `Failed to create content version: ${(err as Error).message}`,
      );
   }
}

export async function getContentVersionById(
   dbClient: DatabaseInstance,
   id: string,
): Promise<ContentVersion> {
   try {
      const result = await dbClient.query.contentVersion.findFirst({
         where: eq(contentVersion.id, id),
      });
      if (!result) throw new NotFoundError("Content version not found");
      return result;
   } catch (err) {
      if (err instanceof NotFoundError) throw err;
      throw new DatabaseError(
         `Failed to get content version: ${(err as Error).message}`,
      );
   }
}

export async function updateContentVersion(
   dbClient: DatabaseInstance,
   id: string,
   data: Partial<ContentVersionInsert>,
): Promise<ContentVersion> {
   try {
      const result = await dbClient
         .update(contentVersion)
         .set(data)
         .where(eq(contentVersion.id, id))
         .returning();
      const updated = result?.[0];
      if (!updated) throw new NotFoundError("Content version not found");
      return updated;
   } catch (err) {
      if (err instanceof NotFoundError) throw err;
      throw new DatabaseError(
         `Failed to update content version: ${(err as Error).message}`,
      );
   }
}

export async function deleteContentVersion(
   dbClient: DatabaseInstance,
   id: string,
): Promise<void> {
   try {
      const result = await dbClient
         .delete(contentVersion)
         .where(eq(contentVersion.id, id))
         .returning();
      const deleted = result?.[0];
      if (!deleted) throw new NotFoundError("Content version not found");
   } catch (err) {
      if (err instanceof NotFoundError) throw err;
      throw new DatabaseError(
         `Failed to delete content version: ${(err as Error).message}`,
      );
   }
}

export async function getLatestVersionByContentId(
   dbClient: DatabaseInstance,
   contentId: string,
): Promise<ContentVersion> {
   try {
      const result = await dbClient.query.contentVersion.findFirst({
         where: eq(contentVersion.contentId, contentId),
         orderBy: desc(contentVersion.version),
      });
      if (!result)
         throw new NotFoundError("No versions found for this content");
      return result;
   } catch (err) {
      if (err instanceof NotFoundError) throw err;
      throw new DatabaseError(
         `Failed to get latest content version: ${(err as Error).message}`,
      );
   }
}

export async function getAllVersionsByContentId(
   dbClient: DatabaseInstance,
   contentId: string,
): Promise<ContentVersion[]> {
   try {
      return await dbClient.query.contentVersion.findMany({
         where: eq(contentVersion.contentId, contentId),
         orderBy: desc(contentVersion.version),
      });
   } catch (err) {
      throw new DatabaseError(
         `Failed to get content versions: ${(err as Error).message}`,
      );
   }
}

export async function getVersionByNumber(
   dbClient: DatabaseInstance,
   contentId: string,
   version: number,
): Promise<ContentVersion> {
   try {
      const result = await dbClient.query.contentVersion.findFirst({
         where: and(
            eq(contentVersion.contentId, contentId),
            eq(contentVersion.version, version),
         ),
      });
      if (!result) throw new NotFoundError("Content version not found");
      return result;
   } catch (err) {
      if (err instanceof NotFoundError) throw err;
      throw new DatabaseError(
         `Failed to get content version by number: ${(err as Error).message}`,
      );
   }
}

export async function getNextVersionNumber(
   dbClient: DatabaseInstance,
   contentId: string,
): Promise<number> {
   try {
      // Get current version from content table
      const contentResult = await dbClient.query.content.findFirst({
         where: eq(content.id, contentId),
         columns: { currentVersion: true },
      });

      if (contentResult?.currentVersion) {
         return contentResult.currentVersion + 1;
      }

      // Fallback to looking up latest version if currentVersion is not set
      const latest = await getLatestVersionByContentId(dbClient, contentId);
      return latest.version + 1;
   } catch (err) {
      if (err instanceof NotFoundError) {
         // No versions exist yet, start with version 1
         return 1;
      }
      throw err;
   }
}
