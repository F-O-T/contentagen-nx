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
         const firstTeam = teams[0];

         if (firstTeam) {
            throw redirect({
               to: "/$slug/$teamId/onboarding",
               params: { slug: params.slug, teamId: firstTeam.id },
            });
         }

         // No teams exist yet — this shouldn't happen in normal flow
         // but stay on onboarding to handle edge case
      }
   },
   component: OrganizationOnboardingRoute,
});

function OrganizationOnboardingRoute() {
   return <OrganizationOnboardingWizard />;
}
