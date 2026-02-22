import { ORPCError } from "@orpc/server";
import { getOrganizationMembers } from "@packages/database/repositories/auth-repository";
import { member, organization } from "@packages/database/schemas/auth";
import { env as serverEnv } from "@packages/environment/server";
import { resolveOrganizationPlan } from "@packages/events/credits";
import {
   generatePresignedPutUrl,
   getMinioClient,
} from "@packages/files/client";
import { getEffectiveProjectLimit } from "@packages/stripe/constants";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { authenticatedProcedure, protectedProcedure } from "../server";

// =============================================================================
// Procedures
// =============================================================================
// Force rebuild: logo upload procedures added

/**
 * Get all organizations the user is a member of, with their role
 */
export const getOrganizations = authenticatedProcedure.handler(
   async ({ context }) => {
      const { db, userId } = context;

      const memberships = await db
         .select({
            id: organization.id,
            name: organization.name,
            slug: organization.slug,
            logo: organization.logo,
            role: member.role,
            onboardingCompleted: organization.onboardingCompleted,
         })
         .from(member)
         .innerJoin(organization, eq(member.organizationId, organization.id))
         .where(eq(member.userId, userId));

      return memberships;
   },
);

/**
 * Get the currently active organization with subscription info
 */
export const getActiveOrganization = protectedProcedure.handler(
   async ({ context }) => {
      const { auth, db, headers, session } = context;

      try {
         const organizationId = session.session.activeOrganizationId;

         if (!organizationId) {
            return null;
         }

         const organization = await auth.api.getFullOrganization({
            headers,
            query: {
               organizationId,
            },
         });

         if (!organization) {
            return null;
         }

         // Fetch active subscriptions for the organization
         const subscriptions = await auth.api.listActiveSubscriptions({
            headers,
            query: { referenceId: organization.id },
         });

         const activeSubscription = subscriptions.find(
            (subscription) =>
               subscription.status === "active" ||
               subscription.status === "trialing",
         );

         // Resolve the organization's plan and calculate project limits
         const plan = await resolveOrganizationPlan(db, organization.id);
         const projectLimit = getEffectiveProjectLimit(plan, null);

         const teams = await auth.api.listOrganizationTeams({
            headers,
            query: { organizationId: organization.id },
         });
         const projectCount = teams.length;

         return {
            ...organization,
            activeSubscription: activeSubscription ?? null,
            projectLimit,
            projectCount,
         };
      } catch (error) {
         // Convert Better Auth API errors to ORPCError
         if (error && typeof error === "object" && "status" in error) {
            const apiError = error as { status: string; statusCode?: number };

            if (
               apiError.status === "UNAUTHORIZED" ||
               apiError.statusCode === 401
            ) {
               throw new ORPCError("UNAUTHORIZED", {
                  message:
                     "Authentication required to access organization data",
               });
            }

            if (
               apiError.status === "FORBIDDEN" ||
               apiError.statusCode === 403
            ) {
               throw new ORPCError("FORBIDDEN", {
                  message:
                     "Insufficient permissions to access organization data",
               });
            }
         }

         // Re-throw ORPCErrors as-is
         if (error instanceof ORPCError) {
            throw error;
         }

         // Convert unknown errors to INTERNAL_SERVER_ERROR
         throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message: "Failed to retrieve organization data",
         });
      }
   },
);

/**
 * List teams for the currently active organization
 */
export const getOrganizationTeams = protectedProcedure.handler(
   async ({ context }) => {
      const { auth, headers, organizationId } = context;

      try {
         const teams = await auth.api.listOrganizationTeams({
            headers,
            query: { organizationId },
         });

         return teams.map((team) => ({
            ...team,
            slug: (team as Record<string, unknown>).slug as string,
         }));
      } catch (error) {
         // Convert Better Auth API errors to ORPCError
         if (error && typeof error === "object" && "status" in error) {
            const apiError = error as { status: string; statusCode?: number };

            if (
               apiError.status === "UNAUTHORIZED" ||
               apiError.statusCode === 401
            ) {
               throw new ORPCError("UNAUTHORIZED", {
                  message:
                     "Authentication required to access organization teams",
               });
            }

            if (
               apiError.status === "FORBIDDEN" ||
               apiError.statusCode === 403
            ) {
               throw new ORPCError("FORBIDDEN", {
                  message:
                     "Insufficient permissions to access organization teams",
               });
            }
         }

         // Re-throw ORPCErrors as-is
         if (error instanceof ORPCError) {
            throw error;
         }

         // Convert unknown errors to INTERNAL_SERVER_ERROR
         throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message: "Failed to retrieve organization teams",
         });
      }
   },
);

/**
 * Get all members of the currently active organization
 */
export const getMembers = protectedProcedure.handler(async ({ context }) => {
   const { db, organizationId } = context;

   const members = await getOrganizationMembers(db, organizationId);

   return members.map((m) => ({
      id: m.id,
      userId: m.userId,
      name: m.user.name,
      email: m.user.email,
      role: m.role,
      image: m.user.image,
      createdAt: m.createdAt,
   }));
});

/**
 * Get teams a specific user has access to within the organization
 */
export const getMemberTeams = protectedProcedure
   .input(z.object({ userId: z.uuid() }))
   .handler(async ({ context, input }) => {
      const { db, organizationId } = context;

      // Get all teams for this organization
      const teams = await db.query.team.findMany({
         where: (team, { eq }) => eq(team.organizationId, organizationId),
      });

      // Get team memberships for this user
      const teamMemberships = await db.query.teamMember.findMany({
         where: (teamMember, { eq }) => eq(teamMember.userId, input.userId),
      });

      const memberTeamIds = new Set(teamMemberships.map((tm) => tm.teamId));

      // Return only teams this user is a member of
      return teams
         .filter((t) => memberTeamIds.has(t.id))
         .map((t) => ({
            id: t.id,
            name: t.name,
         }));
   });

/**
 * Check if organization has a specific addon activated
 */
export const hasAddon = protectedProcedure
   .input(z.object({ addonId: z.string() }))
   .handler(async ({ context, input }) => {
      const { db, organizationId } = context;

      const addon = await db.query.organizationAddons.findFirst({
         where: (addons, { eq, and, or, isNull, gt }) =>
            and(
               eq(addons.organizationId, organizationId),
               eq(addons.addonId, input.addonId),
               or(isNull(addons.expiresAt), gt(addons.expiresAt, new Date())),
            ),
      });

      return { hasAddon: !!addon };
   });

/**
 * Get all active addons for organization
 */
export const getAddons = protectedProcedure.handler(async ({ context }) => {
   const { db, organizationId } = context;

   const addons = await db.query.organizationAddons.findMany({
      where: (addons, { eq, and, or, isNull, gt }) =>
         and(
            eq(addons.organizationId, organizationId),
            or(isNull(addons.expiresAt), gt(addons.expiresAt, new Date())),
         ),
   });

   return addons.map((a) => ({
      id: a.id,
      addonId: a.addonId,
      activatedAt: a.activatedAt,
      expiresAt: a.expiresAt,
      autoRenew: a.autoRenew,
   }));
});

/**
 * Generate presigned URL for organization logo upload
 */
export const generateLogoUploadUrl = protectedProcedure
   .input(
      z.object({
         fileExtension: z.string(),
         contentType: z.string(),
      }),
   )
   .handler(async ({ context, input }) => {
      const { organizationId } = context;

      try {
         const minioClient = getMinioClient(serverEnv);
         const bucketName = "organization-logos";

         // Generate unique filename: org-{orgId}-{uuid}.{ext}
         const fileName = `org-${organizationId}-${crypto.randomUUID()}.${input.fileExtension}`;

         const presignedUrl = await generatePresignedPutUrl(
            fileName,
            bucketName,
            minioClient,
            300, // 5 minutes
         );

         return {
            presignedUrl,
            fileName,
            publicUrl: `/api/files/${bucketName}/${fileName}`,
         };
      } catch (error) {
         console.error("Failed to generate presigned URL:", error);
         throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message: "Failed to generate upload URL",
         });
      }
   });

/**
 * Update organization logo URL
 */
export const updateLogo = protectedProcedure
   .input(
      z.object({
         logoUrl: z.string(),
      }),
   )
   .handler(async ({ context, input }) => {
      const { db, organizationId } = context;

      try {
         await db
            .update(organization)
            .set({ logo: input.logoUrl })
            .where(eq(organization.id, organizationId));

         return { success: true };
      } catch (error) {
         console.error("Failed to update organization logo:", error);
         throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message: "Failed to update logo",
         });
      }
   });
