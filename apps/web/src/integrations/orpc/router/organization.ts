import type { DatabaseInstance } from "@packages/database/client";
import {
   getPublicApiKey as getPublicApiKeyFromDb,
   isOrganizationOwner,
   regeneratePublicApiKey as regeneratePublicApiKeyFromDb,
} from "@packages/database/repositories/auth-repository";
import { member, organization, subscription } from "@packages/database/schemas/auth";
import { PlanName, getEffectiveProjectLimit } from "@packages/stripe/constants";
import { and, eq, or } from "drizzle-orm";
import { ORPCError } from "@orpc/server";
import { protectedProcedure } from "../server";

// =============================================================================
// Helpers
// =============================================================================

const VALID_PLAN_NAMES = new Set<string>(Object.values(PlanName));

async function resolveOrganizationPlan(
   db: DatabaseInstance,
   organizationId: string,
): Promise<PlanName> {
   const [sub] = await db
      .select({ plan: subscription.plan })
      .from(subscription)
      .where(
         and(
            eq(subscription.referenceId, organizationId),
            or(
               eq(subscription.status, "active"),
               eq(subscription.status, "trialing"),
            ),
         ),
      )
      .limit(1);

   if (!sub || !VALID_PLAN_NAMES.has(sub.plan)) {
      return PlanName.FREE;
   }

   return sub.plan as PlanName;
}

// =============================================================================
// Procedures
// =============================================================================

/**
 * Get all organizations the user is a member of, with their role
 */
export const getOrganizations = protectedProcedure
   .handler(async ({ context }) => {
      const { db, userId } = context;

      const memberships = await db
         .select({
            id: organization.id,
            name: organization.name,
            slug: organization.slug,
            logo: organization.logo,
            role: member.role,
         })
         .from(member)
         .innerJoin(organization, eq(member.organizationId, organization.id))
         .where(eq(member.userId, userId));

      return memberships;
   });

/**
 * Get the currently active organization with subscription info
 */
export const getActiveOrganization = protectedProcedure
   .handler(async ({ context }) => {
      const { auth, db, headers, session } = context;

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
   });

/**
 * List teams for the currently active organization
 */
export const getOrganizationTeams = protectedProcedure
   .handler(async ({ context }) => {
      const { auth, headers, organizationId } = context;

      const teams = await auth.api.listOrganizationTeams({
         headers,
         query: { organizationId },
      });

      return teams;
   });

/**
 * Get the public API key for the active organization.
 * Any authenticated member of the organization can read it.
 */
export const getPublicApiKey = protectedProcedure
   .handler(async ({ context }) => {
      const { db, organizationId } = context;

      const publicApiKey = await getPublicApiKeyFromDb(db, organizationId);

      return { publicApiKey };
   });

/**
 * Regenerate the public API key for the active organization.
 * Only organization owners can regenerate the key.
 */
export const regeneratePublicApiKey = protectedProcedure
   .handler(async ({ context }) => {
      const { db, organizationId, userId } = context;

      const isOwner = await isOrganizationOwner(db, userId, organizationId);

      if (!isOwner) {
         throw new ORPCError("FORBIDDEN", {
            message: "Only organization owners can regenerate the public API key",
         });
      }

      const newKey = await regeneratePublicApiKeyFromDb(db, organizationId);

      return { publicApiKey: newKey };
   });
