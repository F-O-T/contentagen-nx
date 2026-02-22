import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated")({
   beforeLoad: async ({ context, location }) => {
      // biome-ignore lint/suspicious/noImplicitAnyLet: assigned inside try-catch
      let session;

      try {
         session = await context.queryClient.fetchQuery(
            context.orpc.session.getSession.queryOptions({}),
         );
      } catch (_error) {
         // If session fetch fails, redirect to sign in
         throw redirect({
            to: "/auth/sign-in",
            search: { redirect: location.href },
         });
      }

      if (!session?.user?.id) {
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
         const activeOrg =
            organizations.find(
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
