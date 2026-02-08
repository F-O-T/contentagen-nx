import { createFileRoute, redirect } from "@tanstack/react-router";
import { OnboardingWizard } from "@/features/onboarding/ui/onboarding-wizard";

export const Route = createFileRoute("/_authenticated/$slug/onboarding")({
   beforeLoad: async ({ context, params }) => {
      const status = await context.queryClient.fetchQuery(
         context.orpc.onboarding.getOnboardingStatus.queryOptions(),
      );

      if (status.onboardingCompleted) {
         throw redirect({
            to: "/$slug/home",
            params: { slug: params.slug },
         });
      }
   },
   component: OnboardingRoute,
});

function OnboardingRoute() {
   return <OnboardingWizard />;
}
