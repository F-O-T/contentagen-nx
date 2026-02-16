import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/$slug/$teamSlug")({
   beforeLoad: async ({ context, params }) => {
      const organizations = await context.queryClient.fetchQuery(
         context.orpc.organization.getOrganizations.queryOptions(),
      );

      const currentOrganization = organizations.find(
         (org) => org.slug === params.slug,
      );

      if (!currentOrganization) {
         throw redirect({ to: "/onboarding" });
      }

      const teams = await context.queryClient.fetchQuery(
         context.orpc.organization.getOrganizationTeams.queryOptions(),
      );

      const currentTeam =
         teams.find((team) => team.slug === params.teamSlug) ?? null;

      if (!currentTeam) {
         const fallbackTeam = teams[0];
         if (fallbackTeam) {
            throw redirect({
               to: "/$slug/$teamSlug/home",
               params: {
                  slug: params.slug,
                  teamSlug: fallbackTeam.slug,
               },
            });
         }

         throw redirect({ to: "/onboarding" });
      }

      return {
         organizations,
         currentOrganization,
         organizationId: currentOrganization.id,
         teams,
         currentTeam,
      };
   },
   component: TeamLayout,
});

function TeamLayout() {
   return <Outlet />;
}
