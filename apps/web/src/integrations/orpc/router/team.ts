import { ORPCError } from "@orpc/server";
import type { DatabaseInstance } from "@packages/database/client";
import { isOrganizationOwner } from "@packages/database/repositories/auth-repository";
import { team, teamMember } from "@packages/database/schemas/auth";
import { resolveOrganizationPlan } from "@packages/events/credits";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure } from "../server";

// =============================================================================
// Validation Schemas
// =============================================================================

const teamIdSchema = z.object({
   teamId: z.uuid(),
});

const domainPatternRegex =
   /^(\*\.)?([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)*[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/;

const updateAllowedDomainsSchema = z.object({
   teamId: z.uuid(),
   allowedDomains: z
      .array(
         z
            .string()
            .min(1)
            .max(253)
            .regex(domainPatternRegex, "Invalid domain pattern"),
      )
      .max(50),
});

// =============================================================================
// Helpers
// =============================================================================

/**
 * Verify that a team belongs to the current organization and return it.
 */
async function verifyTeamOwnership(
   db: DatabaseInstance,
   teamId: string,
   organizationId: string,
) {
   const [result] = await db
      .select({
         id: team.id,
         name: team.name,
         description: team.description,
         allowedDomains: team.allowedDomains,
         publicApiKey: team.publicApiKey,
         createdAt: team.createdAt,
         updatedAt: team.updatedAt,
      })
      .from(team)
      .where(and(eq(team.id, teamId), eq(team.organizationId, organizationId)))
      .limit(1);

   if (!result) {
      throw new ORPCError("NOT_FOUND", {
         message: "Team not found",
      });
   }

   return result;
}

// =============================================================================
// Procedures
// =============================================================================

/**
 * Get a team by ID, verifying it belongs to the user's active organization.
 */
export const get = protectedProcedure
   .input(teamIdSchema)
   .handler(async ({ context, input }) => {
      const { db, organizationId } = context;

      return verifyTeamOwnership(db, input.teamId, organizationId);
   });

/**
 * Get the public API key for a team.
 * Returns the full public API key (stored in team.publicApiKey).
 * Auto-creates a key if none exists (lazy creation).
 */
export const getPublicApiKey = protectedProcedure
   .input(teamIdSchema)
   .handler(async ({ context, input }) => {
      const { auth, db, headers, organizationId, userId } = context;

      try {
         // Verify team belongs to this organization and get the stored public key
         const teamData = await verifyTeamOwnership(
            db,
            input.teamId,
            organizationId,
         );

         // If the team already has a public key stored, return it
         if (teamData.publicApiKey) {
            return { publicApiKey: teamData.publicApiKey, keyId: null };
         }

         // Auto-create if none exists (lazy creation)
         const plan = await resolveOrganizationPlan(db, organizationId);

         const newKey = await auth.api.createApiKey({
            headers,
            body: {
               prefix: "cta_pub",
               name: "Public Key",
               userId,
               metadata: {
                  type: "public",
                  teamId: input.teamId,
                  organizationId,
                  plan,
               },
            },
         });

         // Store the full key in the team table for future retrieval
         await db
            .update(team)
            .set({ publicApiKey: newKey.key })
            .where(eq(team.id, input.teamId));

         return { publicApiKey: newKey.key, keyId: newKey.id };
      } catch (error) {
         // Convert Better Auth API errors to ORPCError
         if (error && typeof error === "object" && "status" in error) {
            const apiError = error as { status: string; statusCode?: number };

            if (
               apiError.status === "UNAUTHORIZED" ||
               apiError.statusCode === 401
            ) {
               throw new ORPCError("UNAUTHORIZED", {
                  message: "Authentication required to access API keys",
               });
            }

            if (
               apiError.status === "FORBIDDEN" ||
               apiError.statusCode === 403
            ) {
               throw new ORPCError("FORBIDDEN", {
                  message: "Insufficient permissions to access API keys",
               });
            }
         }

         // Re-throw ORPCErrors as-is
         if (error instanceof ORPCError) {
            throw error;
         }

         // Convert unknown errors to INTERNAL_SERVER_ERROR
         throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message: "Failed to retrieve public API key",
         });
      }
   });

/**
 * Regenerate the public API key for a team.
 * Owner-only. Deletes the existing key (if any) and creates a new one.
 * Returns the full key value and stores it in team.publicApiKey.
 */
export const regeneratePublicApiKey = protectedProcedure
   .input(teamIdSchema)
   .handler(async ({ context, input }) => {
      const { auth, headers, db, organizationId, userId } = context;

      try {
         // Owner-only check
         const isOwner = await isOrganizationOwner(db, userId, organizationId);
         if (!isOwner) {
            throw new ORPCError("FORBIDDEN", {
               message: "Only organization owners can regenerate API keys",
            });
         }

         // Verify team belongs to this organization
         await verifyTeamOwnership(db, input.teamId, organizationId);

         // Find and delete existing public key for this team
         console.log("[regeneratePublicApiKey] Listing API keys...");
         const existingKeys = await auth.api.listApiKeys({
            headers,
         });
         console.log(
            `[regeneratePublicApiKey] Found ${existingKeys?.length || 0} keys`,
         );

         const existingPublicKey = existingKeys.find(
            (key) =>
               key.metadata?.teamId === input.teamId &&
               key.metadata?.type === "public",
         );

         if (existingPublicKey) {
            console.log(
               `[regeneratePublicApiKey] Deleting existing key: ${existingPublicKey.id}`,
            );
            await auth.api.deleteApiKey({
               headers,
               body: { keyId: existingPublicKey.id },
            });
         }

         // Resolve the organization's plan for metadata
         console.log("[regeneratePublicApiKey] Resolving organization plan...");
         const plan = await resolveOrganizationPlan(db, organizationId);
         console.log(`[regeneratePublicApiKey] Plan: ${plan}`);

         // Create a new public API key
         console.log("[regeneratePublicApiKey] Creating new API key...");
         const newKey = await auth.api.createApiKey({
            headers,
            body: {
               prefix: "cta_pub",
               name: "Public Key",
               userId,
               metadata: {
                  type: "public",
                  teamId: input.teamId,
                  organizationId,
                  plan,
               },
            },
         });

         await db
            .update(team)
            .set({ publicApiKey: newKey.key })
            .where(eq(team.id, input.teamId));

         return { publicApiKey: newKey.key };
      } catch (error) {
         console.error("[regeneratePublicApiKey] Error:", error);
         console.error(
            "[regeneratePublicApiKey] Error stack:",
            error instanceof Error ? error.stack : "No stack",
         );

         // Convert Better Auth API errors to ORPCError
         if (error && typeof error === "object" && "status" in error) {
            const apiError = error as { status: string; statusCode?: number };

            // Map Better Auth status codes to oRPC error codes
            if (
               apiError.status === "UNAUTHORIZED" ||
               apiError.statusCode === 401
            ) {
               throw new ORPCError("UNAUTHORIZED", {
                  message: "Authentication required to regenerate API keys",
               });
            }

            if (
               apiError.status === "FORBIDDEN" ||
               apiError.statusCode === 403
            ) {
               throw new ORPCError("FORBIDDEN", {
                  message: "Insufficient permissions to regenerate API keys",
               });
            }
         }

         // Re-throw ORPCErrors as-is
         if (error instanceof ORPCError) {
            throw error;
         }

         // Convert unknown errors to INTERNAL_SERVER_ERROR
         throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message: "Failed to regenerate public API key",
         });
      }
   });

/**
 * Update the allowed domains for a team.
 * Validates domain patterns and verifies team ownership.
 */
export const updateAllowedDomains = protectedProcedure
   .input(updateAllowedDomainsSchema)
   .handler(async ({ context, input }) => {
      const { db, organizationId } = context;

      // Verify team belongs to this organization
      await verifyTeamOwnership(db, input.teamId, organizationId);

      const [updated] = await db
         .update(team)
         .set({ allowedDomains: input.allowedDomains })
         .where(eq(team.id, input.teamId))
         .returning({ allowedDomains: team.allowedDomains });

      if (!updated) {
         throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message: "Failed to update allowed domains",
         });
      }

      return { allowedDomains: updated.allowedDomains };
   });

/**
 * Get all members of a team (read-only).
 * Uses Better Auth for member data enrichment.
 */
export const getMembers = protectedProcedure
   .input(teamIdSchema)
   .handler(async ({ context, input }) => {
      const { auth, db, headers, organizationId } = context;

      // Verify team belongs to this organization
      await verifyTeamOwnership(db, input.teamId, organizationId);

      // Get organization members via Better Auth
      const orgMembers = await auth.api.listMembers({
         headers,
         query: { organizationId },
      });

      // Get team member IDs
      const teamMemberRecords = await db.query.teamMember.findMany({
         where: (teamMember, { eq }) => eq(teamMember.teamId, input.teamId),
      });

      const teamMemberIds = new Set(teamMemberRecords.map((tm) => tm.userId));

      // Filter org members to only include team members
      const teamMembers = orgMembers.members
         .filter((m) => teamMemberIds.has(m.userId))
         .map((m) => ({
            id: m.userId,
            name: m.user.name,
            email: m.user.email,
            role: m.role,
            image: m.user.image,
            createdAt: new Date(m.createdAt),
         }));

      return teamMembers;
   });

/**
 * Add a member to a team.
 * Requires the user to be an organization member first.
 */
export const addMember = protectedProcedure
   .input(
      z.object({
         teamId: z.uuid(),
         userId: z.uuid(),
      }),
   )
   .handler(async ({ context, input }) => {
      const { db, organizationId } = context;

      // Verify team belongs to this organization
      await verifyTeamOwnership(db, input.teamId, organizationId);

      // Check if user is a member of the organization
      const orgMember = await db.query.member.findFirst({
         where: (member, { eq, and }) =>
            and(
               eq(member.organizationId, organizationId),
               eq(member.userId, input.userId),
            ),
      });

      if (!orgMember) {
         throw new ORPCError("BAD_REQUEST", {
            message: "User must be an organization member first",
         });
      }

      // Check if already a team member
      const existingTeamMember = await db.query.teamMember.findFirst({
         where: (teamMember, { eq, and }) =>
            and(
               eq(teamMember.teamId, input.teamId),
               eq(teamMember.userId, input.userId),
            ),
      });

      if (existingTeamMember) {
         throw new ORPCError("BAD_REQUEST", {
            message: "User is already a team member",
         });
      }

      // Add user to team
      const [newTeamMember] = await db
         .insert(teamMember)
         .values({
            teamId: input.teamId,
            userId: input.userId,
            createdAt: new Date(),
         })
         .returning();

      return newTeamMember;
   });

/**
 * Remove a member from a team.
 */
export const removeMember = protectedProcedure
   .input(
      z.object({
         teamId: z.uuid(),
         userId: z.uuid(),
      }),
   )
   .handler(async ({ context, input }) => {
      const { db, organizationId } = context;

      // Verify team belongs to this organization
      await verifyTeamOwnership(db, input.teamId, organizationId);

      // Remove from team
      await db
         .delete(teamMember)
         .where(
            and(
               eq(teamMember.teamId, input.teamId),
               eq(teamMember.userId, input.userId),
            ),
         );

      return { success: true };
   });
