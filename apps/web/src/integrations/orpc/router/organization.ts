import { protectedProcedure } from "../server";

/**
 * Get all organizations the user is a member of
 */
export const getOrganizations = protectedProcedure
   .handler(async ({ context }) => {
      const { auth, headers } = context;

      const organizations = await auth.api.listOrganizations({
         headers,
      });

      return organizations;
   });

/**
 * Get the currently active organization with subscription info
 */
export const getActiveOrganization = protectedProcedure
   .handler(async ({ context }) => {
      const { auth, headers, session } = context;

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

      return {
         ...organization,
         activeSubscription: activeSubscription ?? null,
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
