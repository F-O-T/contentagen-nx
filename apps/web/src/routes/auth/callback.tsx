import { createFileRoute, redirect } from "@tanstack/react-router";
import { authClient } from "@/integrations/better-auth/auth-client";

export const Route = createFileRoute("/auth/callback")({
   beforeLoad: async ({ context }) => {
      // Fetch user's organizations to get the correct slug
      const organizations = await context.queryClient.fetchQuery(
         context.orpc.organization.getOrganizations.queryOptions(),
      );

      const firstOrg = organizations[0];

      if (firstOrg) {
         // Fetch teams to find the first team for routing
         const teams = await context.queryClient.fetchQuery(
            context.orpc.organization.getOrganizationTeams.queryOptions(),
         );
         const fallbackTeam = teams[0];

         if (fallbackTeam) {
            throw redirect({
               to: "/$slug/$teamId/home",
               params: { slug: firstOrg.slug, teamId: fallbackTeam.id },
            });
         }

         // No teams — go to onboarding
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
