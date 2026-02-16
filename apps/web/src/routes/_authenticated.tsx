import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated")({
   beforeLoad: async ({ context, location }) => {
      const session = await context.queryClient.fetchQuery(
         context.orpc.session.getSession.queryOptions({}),
      );

      if (!session?.user) {
         throw redirect({
            to: "/auth/sign-in",
            search: { redirect: location.href },
         });
      }

      // Check if user has any organizations
      const organizations = await context.queryClient.fetchQuery(
         context.orpc.organization.getOrganizations.queryOptions(),
      );

      const hasOrgs = organizations.length > 0;

      // If no orgs and not already on onboarding, redirect
      if (!hasOrgs && !location.pathname.startsWith("/onboarding")) {
         throw redirect({ to: "/onboarding" });
      }

      // If has orgs, check if active org needs onboarding
      if (hasOrgs) {
         const activeOrg = organizations.find(
            (org) => org.id === session.session.activeOrganizationId,
         ) ?? organizations[0];

         if (
            activeOrg &&
            !activeOrg.onboardingCompleted &&
            !location.pathname.startsWith("/onboarding")
         ) {
            throw redirect({ to: "/onboarding" });
         }
      }

      return {
         session,
         userId: session.user.id,
      };
   },
   component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
   return <Outlet />;
}
