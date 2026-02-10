import { createFileRoute, redirect } from "@tanstack/react-router";
import { OnboardingWizard } from "@/features/onboarding/ui/onboarding-wizard";

export const Route = createFileRoute("/_authenticated/$slug/onboarding")({
   beforeLoad: async ({ context, params }) => {
      const status = await context.queryClient.fetchQuery(
         context.orpc.onboarding.getOnboardingStatus.queryOptions(),
      );

      if (status.onboardingCompleted) {
         const teams = await context.queryClient.fetchQuery(
            context.orpc.organization.getOrganizationTeams.queryOptions(),
         );
         const fallbackTeam = teams[0];

         if (fallbackTeam) {
            throw redirect({
               to: "/$slug/$teamId/home",
               params: { slug: params.slug, teamId: fallbackTeam.id },
            });
         }

         // No teams exist yet — stay on onboarding
      }
   },
   component: OnboardingRoute,
});

function OnboardingRoute() {
   return <OnboardingWizard />;
}
