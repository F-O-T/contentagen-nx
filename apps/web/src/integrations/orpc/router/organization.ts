import { getOrganizationMembers } from "@packages/database/repositories/auth-repository";
import { member, organization } from "@packages/database/schemas/auth";
import { resolveOrganizationPlan } from "@packages/events/credits";
import { getEffectiveProjectLimit } from "@packages/stripe/constants";
import { eq } from "drizzle-orm";
import { authenticatedProcedure, protectedProcedure } from "../server";

// =============================================================================
// Procedures
// =============================================================================

/**
 * Get all organizations the user is a member of, with their role
 */
export const getOrganizations = authenticatedProcedure
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
 * Get all members of the currently active organization
 */
export const getMembers = protectedProcedure
   .handler(async ({ context }) => {
      const { db, organizationId } = context;

      const members = await getOrganizationMembers(db, organizationId);

      return members.map((m) => ({
         id: m.id,
         name: m.user.name,
         email: m.user.email,
         role: m.role,
         image: m.user.image,
         createdAt: m.createdAt,
      }));
   });

