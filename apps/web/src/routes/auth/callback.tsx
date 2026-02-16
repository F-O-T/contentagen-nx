import { createFileRoute, redirect } from "@tanstack/react-router";
import { authClient } from "@/integrations/better-auth/auth-client";

export const Route = createFileRoute("/auth/callback")({
   beforeLoad: async ({ context }) => {
      // Fetch onboarding status to determine where to redirect
      // Note: This might fail for brand new users who don't have teams yet
      let status: {
         organization: { onboardingCompleted: boolean };
         project: { onboardingCompleted: boolean };
      } | null = null;
      try {
         status = await context.queryClient.fetchQuery(
            context.orpc.onboarding.getOnboardingStatus.queryOptions(),
         );
      } catch (_error) {
         // If status fetch fails (no team yet), assume project onboarding is incomplete
         // We'll still check org status and route accordingly
         status = null;
      }

      // Fetch user's organizations to get the correct slug
      const organizations = await context.queryClient.fetchQuery(
         context.orpc.organization.getOrganizations.queryOptions(),
      );

      const firstOrg = organizations.length > 0 ? organizations[0] : undefined;

      if (firstOrg) {
         // Fetch teams to find the first team for routing
         // This may fail if session doesn't have activeTeamId yet (protectedProcedure requires it)
         let teams: { id: string }[] = [];
         try {
            teams = await context.queryClient.fetchQuery(
               context.orpc.organization.getOrganizationTeams.queryOptions(),
            );
         } catch {
            // If the protected procedure fails (no active team in session),
            // teams stays empty — we'll route to org onboarding which sets up the team
         }
         const fallbackTeam = teams.length > 0 ? teams[0] : undefined;

         // Check if both org and project onboarding are complete
         const bothComplete = status
            ? status.organization.onboardingCompleted &&
              status.project.onboardingCompleted
            : false;

         if (fallbackTeam && bothComplete) {
            // Both complete → go to dashboard
            throw redirect({
               to: "/$slug/$teamId/home",
               params: { slug: firstOrg.slug, teamId: fallbackTeam.id },
            });
         }

         if (status?.organization.onboardingCompleted && fallbackTeam) {
            // Org complete but project incomplete → go to project onboarding
            throw redirect({
               to: "/$slug/$teamId/onboarding",
               params: { slug: firstOrg.slug, teamId: fallbackTeam.id },
            });
         }

         // Org not complete OR no teams yet → go to org onboarding
         // (org onboarding creates the first team if needed)
         throw redirect({
            to: "/$slug/onboarding",
            params: { slug: firstOrg.slug },
         });
      }

      // No organization exists — sign out to break the redirect loop
      // (the /auth parent redirects authenticated users back here,
      // so we must clear the session before redirecting to sign-in)
      await authClient.signOut();
      context.queryClient.removeQueries({
         queryKey: context.orpc.session.getSession.queryOptions().queryKey,
      });

      throw redirect({ to: "/auth/sign-in" });
   },
   component: () => null,
});
