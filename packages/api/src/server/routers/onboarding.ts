import { getTotalWriters } from "@packages/database/repositories/writer-repository";
import { findOrganizationById } from "@packages/database/repositories/auth-repository";
import { APIError } from "@packages/utils/errors";
import { protectedProcedure, router } from "../trpc";

export const onboardingRouter = router({
   completeOnboarding: protectedProcedure.mutation(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      const organizationId = resolvedCtx.organizationId;

      if (!organizationId) {
         throw APIError.unauthorized("Unauthorized");
      }

      await resolvedCtx.auth.api.updateOrganization({
         body: {
            data: {
               onboardingCompleted: true,
            },
            organizationId,
         },
         headers: resolvedCtx.headers,
      });

      return { success: true };
   }),

   getOnboardingStatus: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      const organizationId = resolvedCtx.organizationId;
      const userId = resolvedCtx.session?.user?.id;

      if (!organizationId) {
         throw APIError.unauthorized("Unauthorized");
      }

      const organization = await findOrganizationById(
         resolvedCtx.db,
         organizationId,
      );

      if (!organization) {
         throw APIError.notFound("Organization not found");
      }

      const writersCount = await getTotalWriters(resolvedCtx.db, {
         organizationId,
         userId,
      });

      const hasWriters = writersCount > 0;

      return {
         hasWriters,
         needsOnboarding: !organization.onboardingCompleted || !hasWriters,
         organizationSlug: organization.slug,
         organizationContext: organization.context,
      };
   }),
});
