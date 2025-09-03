import type { DatabaseInstance } from "../client";
import { DatabaseError, NotFoundError } from "@packages/errors";

export async function findMemberByUserId(
   dbClient: DatabaseInstance,
   userId: string,
) {
   try {
      const result = await dbClient.query.member.findFirst({
         where: (member, { eq }) => eq(member.userId, userId),
      });
      if (!result) throw new NotFoundError("User not found");
      return result;
   } catch (err) {
      if (err instanceof NotFoundError) throw err;
      throw new DatabaseError(
         `Failed to find user by id: ${(err as Error).message}`,
      );
   }
}

export async function findOrganizationById(
   dbClient: DatabaseInstance,
   organizationId: string,
) {
   try {
      const result = await dbClient.query.organization.findFirst({
         where: (org, { eq }) => eq(org.id, organizationId),
      });
      if (!result) throw new NotFoundError("Organization not found");
      return result;
   } catch (err) {
      if (err instanceof NotFoundError) throw err;
      throw new DatabaseError(
         `Failed to find organization by id: ${(err as Error).message}`,
      );
   }
}

export async function isOrganizationOwner(
   dbClient: DatabaseInstance,
   userId: string,
   organizationId: string,
) {
   try {
      const result = await dbClient.query.member.findFirst({
         where: (member, { eq, and }) =>
            and(
               eq(member.userId, userId),
               eq(member.organizationId, organizationId),
               eq(member.role, "owner"),
            ),
      });
      return !!result;
   } catch (err) {
      throw new DatabaseError(
         `Failed to check organization ownership: ${(err as Error).message}`,
      );
   }
}

export async function getOrganizationMembers(
   dbClient: DatabaseInstance,
   organizationId: string,
) {
   try {
      const result = await dbClient.query.member.findMany({
         where: (member, { eq }) => eq(member.organizationId, organizationId),
         with: {
            user: true,
         },
      });
      return result;
   } catch (err) {
      throw new DatabaseError(
         `Failed to get organization members: ${(err as Error).message}`,
      );
   }
}
