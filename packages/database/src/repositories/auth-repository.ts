import type { DatabaseInstance } from "../client";
import { eq } from "drizzle-orm";
import { AppError, propagateError } from "@packages/utils/errors";
import { organization } from "../schemas/auth";

export async function findMemberByUserId(
   dbClient: DatabaseInstance,
   userId: string,
) {
   try {
      const result = await dbClient.query.member.findFirst({
         where: (member, { eq }) => eq(member.userId, userId),
      });
      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
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
      if (!result) throw AppError.database("Organization not found");
      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
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
      throw AppError.database(
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
      throw AppError.database(
         `Failed to get organization members: ${(err as Error).message}`,
      );
   }
}

export async function updateOrganization(
   dbClient: DatabaseInstance,
   organizationId: string,
   data: { logo?: string },
) {
   try {
      const result = await dbClient
         .update(organization)
         .set(data)
         .where(eq(organization.id, organizationId))
         .returning();

      if (!result.length) {
         throw AppError.database("Organization not found");
      }

      return result[0];
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to update organization: ${(err as Error).message}`,
      );
   }
}
