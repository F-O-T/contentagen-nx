import { ORPCError } from "@orpc/server";
import {
	getRateLimitConfig,
} from "@packages/authentication/api-key-config";
import type { DatabaseInstance } from "@packages/database/client";
import { isOrganizationOwner } from "@packages/database/repositories/auth-repository";
import { team } from "@packages/database/schemas/auth";
import { resolveOrganizationPlan } from "@packages/events/credits";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure } from "../server";

// =============================================================================
// Validation Schemas
// =============================================================================

const teamIdSchema = z.object({
	teamId: z.string().uuid(),
});

const domainPatternRegex =
	/^(\*\.)?([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)*[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/;

const updateAllowedDomainsSchema = z.object({
	teamId: z.string().uuid(),
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
 * Returns the visible prefix portion (start field).
 * Auto-creates a key if none exists (lazy creation).
 */
export const getPublicApiKey = protectedProcedure
	.input(teamIdSchema)
	.handler(async ({ context, input }) => {
		const { auth, db, headers, organizationId, userId } = context;

		// Verify team belongs to this organization
		await verifyTeamOwnership(db, input.teamId, organizationId);

		const keys = await auth.api.listApiKeys({
			headers,
		});

		const publicKey = keys.find(
			(key: any) =>
				key.metadata?.teamId === input.teamId &&
				key.metadata?.type === "public",
		);

		if (publicKey) {
			return { publicApiKey: publicKey.start ?? null, keyId: publicKey.id };
		}

		// Auto-create if none exists (lazy creation)
		const plan = await resolveOrganizationPlan(db, organizationId);
		const rateLimitConfig = getRateLimitConfig(plan);

		const newKey = await auth.api.createApiKey({
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
				...rateLimitConfig,
			},
		});

		return { publicApiKey: newKey.key, keyId: newKey.id };
	});

/**
 * Regenerate the public API key for a team.
 * Owner-only. Deletes the existing key (if any) and creates a new one.
 * Returns the full key value (shown only once).
 */
export const regeneratePublicApiKey = protectedProcedure
	.input(teamIdSchema)
	.handler(async ({ context, input }) => {
		const { auth, headers, db, organizationId, userId } = context;

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
		const existingKeys = await auth.api.listApiKeys({
			headers,
		});

		const existingPublicKey = existingKeys.find(
			(key: any) =>
				key.metadata?.teamId === input.teamId &&
				key.metadata?.type === "public",
		);

		if (existingPublicKey) {
			await auth.api.deleteApiKey({
				body: { keyId: existingPublicKey.id },
			});
		}

		// Resolve the organization's plan for rate limits
		const plan = await resolveOrganizationPlan(db, organizationId);
		const rateLimitConfig = getRateLimitConfig(plan);

		// Create a new public API key
		const newKey = await auth.api.createApiKey({
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
				...rateLimitConfig,
			},
		});

		return { publicApiKey: newKey.key };
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
