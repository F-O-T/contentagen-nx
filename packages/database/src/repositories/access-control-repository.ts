import { AppError, propagateError } from "@packages/utils/errors";
import type { DatabaseInstance } from "../client";
import type { ContentSelect } from "../schemas/content";
import { getAgentById } from "./agent-repository";
import { getContentById } from "./content-repository";

/**
 * Check if a user can modify content based on organization membership.
 * Access is granted if:
 * - Content has an agentId and user belongs to the same organization as the agent
 * - Content has no agentId and user belongs to the content's organization
 */
export async function canModifyContent(
   dbClient: DatabaseInstance,
   contentId: string,
   organizationId: string,
): Promise<boolean> {
   try {
      const content = await getContentById(dbClient, contentId);
      if (!content) {
         return false;
      }

      // Content without agent - check organizationId directly
      if (!content.agentId) {
         return content.organizationId === organizationId;
      }

      // Content with agent - check agent's organization
      const agent = await getAgentById(dbClient, content.agentId);
      if (!agent) {
         return false;
      }

      // User can modify if they belong to the same organization as the agent
      return agent.organizationId === organizationId;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to check content modification access: ${(err as Error).message}`,
      );
   }
}

/**
 * Get content with access control validation.
 * Throws an error if the user doesn't have access.
 */
export async function getContentWithAccessControl(
   dbClient: DatabaseInstance,
   contentId: string,
   organizationId: string,
) {
   try {
      const content = await getContentById(dbClient, contentId);
      if (!content) {
         throw AppError.database("Content not found");
      }

      // Content without agent - check organizationId directly or shared status
      if (!content.agentId) {
         const hasAccess =
            content.organizationId === organizationId ||
            content.shareStatus === "shared";

         if (!hasAccess) {
            throw AppError.database("Access denied to content");
         }
         return content;
      }

      // Content with agent - check agent's organization
      const agent = await getAgentById(dbClient, content.agentId);
      if (!agent) {
         throw AppError.database("Agent not found for content");
      }

      // Check access: belongs to the same organization OR content is shared
      const hasAccess =
         agent.organizationId === organizationId ||
         content.shareStatus === "shared";

      if (!hasAccess) {
         throw AppError.database("Access denied to content");
      }

      return content;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to get content with access control: ${(err as Error).message}`,
      );
   }
}

/**
 * Check read and write access for content.
 * - Read access: same organization OR content is shared
 * - Write access: same organization only
 */
export async function hasContentAccess(
   dbClient: DatabaseInstance,
   content: ContentSelect,
   organizationId: string,
): Promise<{ canRead: boolean; canWrite: boolean }> {
   try {
      // Content without agent - check organizationId directly
      if (!content.agentId) {
         // User belongs to the content's organization
         if (content.organizationId === organizationId) {
            return { canRead: true, canWrite: true };
         }

         // Content is shared (public read access)
         if (content.shareStatus === "shared") {
            return { canRead: true, canWrite: false };
         }

         return { canRead: false, canWrite: false };
      }

      // Content with agent - check agent's organization
      const agent = await getAgentById(dbClient, content.agentId);
      if (!agent) {
         return { canRead: false, canWrite: false };
      }

      // User belongs to the same organization as the agent
      if (agent.organizationId === organizationId) {
         return { canRead: true, canWrite: true };
      }

      // Content is shared (public read access)
      if (content.shareStatus === "shared") {
         return { canRead: true, canWrite: false };
      }

      return { canRead: false, canWrite: false };
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to check content access: ${(err as Error).message}`,
      );
   }
}
