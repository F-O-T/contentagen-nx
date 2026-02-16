import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/auth/callback")({
   beforeLoad: async ({ context }) => {
      // Fetch user's organizations to determine where to redirect
      const organizations = await context.queryClient.fetchQuery(
         context.orpc.organization.getOrganizations.queryOptions(),
      );

      const firstOrg = organizations.length > 0 ? organizations[0] : undefined;

      if (!firstOrg) {
         // No organization — redirect to onboarding
         throw redirect({ to: "/onboarding" });
      }

      // Check if org onboarding is complete
      if (!firstOrg.onboardingCompleted) {
         throw redirect({ to: "/onboarding" });
      }

      // Org is onboarded, find a team to redirect to
      let teams: { id: string; slug: string }[] = [];
      try {
         teams = await context.queryClient.fetchQuery(
            context.orpc.organization.getOrganizationTeams.queryOptions(),
         );
      } catch {
         // If team fetch fails, go to onboarding
         throw redirect({ to: "/onboarding" });
      }

      const fallbackTeam = teams.length > 0 ? teams[0] : undefined;

      if (fallbackTeam) {
         throw redirect({
            to: "/$slug/$teamSlug/home",
            params: {
               slug: firstOrg.slug,
               teamSlug: fallbackTeam.slug,
            },
         });
      }

      // Org exists but no teams — go to onboarding
      throw redirect({ to: "/onboarding" });
   },
   component: () => null,
});
