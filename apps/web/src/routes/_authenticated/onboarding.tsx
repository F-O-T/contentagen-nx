import { createFileRoute, redirect } from "@tanstack/react-router";
import { OnboardingWizard } from "@/features/onboarding/ui/onboarding-wizard";

export const Route = createFileRoute("/_authenticated/onboarding")({
   beforeLoad: async ({ context }) => {
      // biome-ignore lint/suspicious/noImplicitAnyLet: assigned inside try-catch
      let session;

      try {
         session = await context.queryClient.fetchQuery(
            context.orpc.session.getSession.queryOptions({}),
         );
      } catch (_error) {
         throw redirect({ to: "/auth/sign-in" });
      }

      if (!session?.user?.id) {
         throw redirect({ to: "/auth/sign-in" });
      }

      const organizations = await context.queryClient.fetchQuery(
         context.orpc.organization.getOrganizations.queryOptions(),
      );

      // Find active org or first org
      const activeOrg =
         organizations.find(
            (org) => org.id === session.session.activeOrganizationId,
         ) ?? organizations[0];

      // Don't redirect away from onboarding based only on org completion.
      // The wizard dynamically determines which steps are needed (profile,
      // workspace, project, products). Redirecting here causes loops when
      // org is completed but project onboarding isn't, since _dashboard.tsx
      // redirects back to /onboarding.

      return {
         session,
         organizations,
         activeOrg: activeOrg ?? null,
      };
   },
   component: OnboardingPage,
});

function OnboardingPage() {
   const { session, organizations, activeOrg } = Route.useRouteContext();

   return (
      <OnboardingWizard
         activeOrg={activeOrg}
         organizations={organizations}
         session={session}
      />
   );
}
