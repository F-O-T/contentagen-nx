import { createFileRoute, redirect } from "@tanstack/react-router";
import { OrganizationOnboardingWizard } from "@/features/onboarding/ui/organization-onboarding-wizard";

export const Route = createFileRoute("/_authenticated/$slug/onboarding/")({
   beforeLoad: async ({ context, params }) => {
      const status = await context.queryClient.fetchQuery(
         context.orpc.onboarding.getOnboardingStatus.queryOptions(),
      );

      // If organization onboarding is complete, redirect to project onboarding
      if (status.organization.onboardingCompleted) {
         const teams = await context.queryClient.fetchQuery(
            context.orpc.organization.getOrganizationTeams.queryOptions(),
         );

         if (teams.length > 0) {
            const firstTeam = teams[0];
            throw redirect({
               to: "/$slug/$teamId/onboarding",
               params: { slug: params.slug, teamId: firstTeam.id },
            });
         }

         // No teams exist yet — stay on onboarding page
         // This edge case is handled by the onboarding wizard
      }
   },
   component: OrganizationOnboardingRoute,
});

function OrganizationOnboardingRoute() {
   return <OrganizationOnboardingWizard />;
}
