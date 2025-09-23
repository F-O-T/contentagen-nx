import type { DatabaseInstance } from "../client";
import type { ContentSelect } from "../schemas/content";
import { AppError, propagateError } from "@packages/utils/errors";
import { eq } from "drizzle-orm";

/**
 * Repository for access control operations
 * Handles permissions and access checks for various entities
 */

/**
 * Check content access permissions
 * Returns both read and write permissions in a single call
 */
export async function hasContentAccess(
   dbClient: DatabaseInstance,
   content: ContentSelect,
   userId?: string,
   organizationId?: string,
): Promise<{ canRead: boolean; canWrite: boolean }> {
   try {
      const agent = await dbClient.query.agent.findFirst({
         where: (agent, { eq }) => eq(agent.id, content.agentId),
      });

      if (!agent) return { canRead: false, canWrite: false };

      const isOwner =
         (userId && agent.userId === userId) ||
         (organizationId && agent.organizationId === organizationId);

      if (isOwner) {
         return { canRead: true, canWrite: true };
      }

      return {
         canRead: content.shareStatus === "shared",
         canWrite: false,
      };
   } catch (err) {
      console.error("Failed to check content access permissions:", err);
      throw AppError.database("Failed to check content access permissions");
   }
}

/**
 * Get content with access control validation
 * Throws NotFoundError if user doesn't have access
 */
export async function getContentWithAccessControl(
   dbClient: DatabaseInstance,
   contentId: string,
   userId?: string,
   organizationId?: string,
): Promise<ContentSelect> {
   try {
      const contentItem = await dbClient.query.content.findFirst({
         where: (content) => eq(content.id, contentId),
      });

      if (!contentItem) throw AppError.database("Content not found");

      const { canRead } = await hasContentAccess(
         dbClient,
         contentItem,
         userId,
         organizationId,
      );

      if (!canRead) throw AppError.database("Content not found");

      return contentItem;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to get content with access control: ${(err as Error).message}`,
      );
   }
}

/**
 * Check if user can modify content (write access)
 */
export async function canModifyContent(
   dbClient: DatabaseInstance,
   contentId: string,
   userId?: string,
   organizationId?: string,
): Promise<boolean> {
   try {
      const contentItem = await dbClient.query.content.findFirst({
         where: (content) => eq(content.id, contentId),
      });

      if (!contentItem) return false;

      const { canWrite } = await hasContentAccess(
         dbClient,
         contentItem,
         userId,
         organizationId,
      );

      return canWrite;
   } catch (err) {
      throw AppError.database(
         `Failed to check content modification access: ${(err as Error).message}`,
      );
   }
}
