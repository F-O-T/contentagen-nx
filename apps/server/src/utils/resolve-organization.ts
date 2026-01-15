import type { DatabaseInstance } from "@packages/database/client";
import { getOrganizationMembership } from "@packages/database/repositories/auth-repository";

/**
 * Resolve organization ID from request headers or session.
 *
 * This mirrors the logic in tRPC's isAuthed middleware to ensure
 * consistent organization resolution across both tRPC and Elysia routes.
 *
 * Priority:
 * 1. x-organization-slug header (lookup organization by slug)
 * 2. activeOrganizationId from session
 */
export async function resolveOrganizationId(
   db: DatabaseInstance,
   userId: string,
   headers: Headers,
   sessionOrgId: string | null | undefined,
): Promise<string | undefined> {
   const organizationSlug = headers.get("x-organization-slug");

   if (organizationSlug) {
      const { organization } = await getOrganizationMembership(
         db,
         userId,
         organizationSlug,
      );
      return organization?.id;
   }

   return sessionOrgId ?? undefined;
}
