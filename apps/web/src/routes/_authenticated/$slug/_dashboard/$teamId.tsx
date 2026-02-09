import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import type { Organization } from "@/integrations/orpc/router/organization";
import type { Team } from "@/integrations/orpc/router/team";

export const Route = createFileRoute(
   "/_authenticated/$slug/_dashboard/$teamId",
)({
   beforeLoad: async ({ context, params }) => {
      const organizations = await context.queryClient.fetchQuery(
         context.orpc.organization.getOrganizations.queryOptions(),
      );

      const currentOrganization = organizations.find(
         (org: Organization) => org.slug === params.slug,
      );

      if (!currentOrganization) {
         const firstOrg = organizations[0];
         if (firstOrg) {
            throw redirect({
               to: "/$slug/home",
               params: { slug: firstOrg.slug },
            });
         }

         throw redirect({ to: "/auth/sign-in" });
      }

      const teams = await context.queryClient.fetchQuery(
         context.orpc.organization.getOrganizationTeams.queryOptions(),
      );

      const currentTeam =
         teams.find((team: Team) => team.id === params.teamId) ?? null;

      if (!currentTeam) {
         const fallbackTeam = teams[0];
         if (fallbackTeam) {
            throw redirect({
               to: "/$slug/$teamId/home",
               params: { slug: params.slug, teamId: fallbackTeam.id },
            });
         }

         throw redirect({
            to: "/$slug/home",
            params: { slug: params.slug },
         });
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
