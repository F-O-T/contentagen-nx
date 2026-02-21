import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/$slug")({
   beforeLoad: async ({ context, params, location }) => {
      const organizations = await context.queryClient.fetchQuery(
         context.orpc.organization.getOrganizations.queryOptions(),
      );

      // No organizations — redirect to onboarding
      if (organizations.length === 0) {
         throw redirect({ to: "/onboarding" });
      }

      const currentOrganization = organizations.find(
         (org) => org.slug === params.slug,
      );

      if (!currentOrganization) {
         const firstOrg = organizations[0];
         if (firstOrg) {
            const teams = await context.queryClient.fetchQuery(
               context.orpc.organization.getOrganizationTeams.queryOptions(),
            );
            const fallbackTeam = teams[0];

            if (fallbackTeam) {
               throw redirect({
                  to: "/$slug/$teamSlug/home",
                  params: {
                     slug: firstOrg.slug,
                     teamSlug: fallbackTeam.slug,
                  },
               });
            }

            // Org exists but no teams — redirect to onboarding
            throw redirect({ to: "/onboarding" });
         }
      }

      // If navigating directly to /$slug (no child route), redirect to first team
      const isBarePath =
         location.pathname === `/${params.slug}` ||
         location.pathname === `/${params.slug}/`;

      if (isBarePath) {
         const teams = await context.queryClient.fetchQuery(
            context.orpc.organization.getOrganizationTeams.queryOptions(),
         );
         const firstTeam = teams[0];

         if (firstTeam) {
            throw redirect({
               to: "/$slug/$teamSlug/home",
               params: {
                  slug: params.slug,
                  teamSlug: firstTeam.slug,
               },
            });
         }

         throw redirect({ to: "/onboarding" });
      }

      return {
         organizations,
         currentOrganization,
         organizationId: currentOrganization?.id,
      };
   },
   component: OrganizationLayout,
});

function OrganizationLayout() {
   return <Outlet />;
}
