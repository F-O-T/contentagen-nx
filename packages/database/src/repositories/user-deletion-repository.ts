import { eq } from "drizzle-orm";
import type { DatabaseInstance } from "../client";
import { member, organization, writer } from "../schema";

/**
 * Delete organization-scoped data for a specific organization.
 * This is a helper function used during user deletion.
 */
async function deleteOrganizationScopedData(
   tx: Parameters<Parameters<DatabaseInstance["transaction"]>[0]>[0],
   organizationId: string,
) {
   // Content is deleted via cascade when writer is deleted
   await tx.delete(writer).where(eq(writer.organizationId, organizationId));
}

/**
 * Delete all user data from the database across all organizations they belong to.
 * This includes: content, writers, and memberships.
 *
 * User-specific auth data (sessions, accounts, etc) will cascade via onDelete: "cascade".
 */
export async function deleteAllUserData(db: DatabaseInstance, userId: string) {
   await db.transaction(async (tx) => {
      // First, get all organizations the user belongs to
      const userMemberships = await tx.query.member.findMany({
         where: (m, { eq: mEq }) => mEq(m.userId, userId),
      });

      const organizationIds = userMemberships.map((m) => m.organizationId);

      // Delete organization-scoped data for each organization
      for (const orgId of organizationIds) {
         await deleteOrganizationScopedData(tx, orgId);
      }

      // Delete user-scoped data (once for the user)
      // Note: notification-related tables have been removed

      // Delete all memberships for this user
      await tx.delete(member).where(eq(member.userId, userId));

      // Check each organization and delete if no remaining members
      for (const orgId of organizationIds) {
         const remainingMembers = await tx.query.member.findMany({
            where: (m, { eq: mEq }) => mEq(m.organizationId, orgId),
         });

         if (remainingMembers.length === 0) {
            await tx.delete(organization).where(eq(organization.id, orgId));
         }
      }
   });
}
