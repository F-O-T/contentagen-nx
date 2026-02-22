import { AppError, propagateError } from "@packages/utils/errors";
import { and, eq } from "drizzle-orm";
import type { DatabaseInstance } from "../client";
import { content } from "../schemas/content";
import {
   type RelatedContentInsert,
   relatedContent,
} from "../schemas/related-content";

export async function addRelatedContent(
   dbClient: DatabaseInstance,
   data: RelatedContentInsert,
) {
   try {
      // Prevent self-referencing
      if (data.sourceContentId === data.targetContentId) {
         throw AppError.validation("Content cannot be related to itself");
      }

      // Check if relation already exists
      const existing = await dbClient.query.relatedContent.findFirst({
         where: (rc, { eq: eqOp, and: andOp }) =>
            andOp(
               eqOp(rc.sourceContentId, data.sourceContentId),
               eqOp(rc.targetContentId, data.targetContentId),
            ),
      });

      if (existing) {
         return { data: existing, created: false };
      }

      const result = await dbClient
         .insert(relatedContent)
         .values(data)
         .returning();
      return { data: result[0], created: true };
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to add related content: ${(err as Error).message}`,
      );
   }
}

export async function removeRelatedContent(
   dbClient: DatabaseInstance,
   sourceContentId: string,
   targetContentId: string,
) {
   try {
      const result = await dbClient
         .delete(relatedContent)
         .where(
            and(
               eq(relatedContent.sourceContentId, sourceContentId),
               eq(relatedContent.targetContentId, targetContentId),
            ),
         )
         .returning();
      return result[0];
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to remove related content: ${(err as Error).message}`,
      );
   }
}

export async function getRelatedContentBySourceId(
   dbClient: DatabaseInstance,
   sourceContentId: string,
) {
   try {
      const result = await dbClient.query.relatedContent.findMany({
         where: (rc, { eq: eqOp }) => eqOp(rc.sourceContentId, sourceContentId),
         orderBy: (rc, { asc }) => asc(rc.position),
         with: {
            targetContent: {
               columns: {
                  id: true,
                  meta: true,
                  imageUrl: true,
                  status: true,
                  createdAt: true,
                  organizationId: true,
               },
            },
         },
      });
      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to get related content: ${(err as Error).message}`,
      );
   }
}

export async function updateRelatedContentOrder(
   dbClient: DatabaseInstance,
   sourceContentId: string,
   orderedTargetIds: string[],
) {
   try {
      // Update positions based on array order
      await Promise.all(
         orderedTargetIds.map((targetId, index) =>
            dbClient
               .update(relatedContent)
               .set({ position: index })
               .where(
                  and(
                     eq(relatedContent.sourceContentId, sourceContentId),
                     eq(relatedContent.targetContentId, targetId),
                  ),
               ),
         ),
      );
      return { success: true };
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to update related content order: ${(err as Error).message}`,
      );
   }
}

// For public shared view - get published related posts only
export async function getPublishedRelatedContent(
   dbClient: DatabaseInstance,
   contentId: string,
) {
   try {
      const result = await dbClient
         .select({
            id: content.id,
            meta: content.meta,
            imageUrl: content.imageUrl,
            createdAt: content.createdAt,
         })
         .from(relatedContent)
         .innerJoin(content, eq(relatedContent.targetContentId, content.id))
         .where(
            and(
               eq(relatedContent.sourceContentId, contentId),
               eq(content.status, "published"),
               eq(content.shareStatus, "shared"),
            ),
         )
         .orderBy(relatedContent.position);
      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to get published related content: ${(err as Error).message}`,
      );
   }
}
