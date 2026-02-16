import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated")({
   beforeLoad: async ({ context, location }) => {
      // Get session from cache (prefetched in __root.tsx)
      const session = await context.queryClient.fetchQuery(
         context.orpc.session.getSession.queryOptions({}),
      );

      // If not authenticated, redirect to sign-in with return URL
      if (!session?.user) {
         throw redirect({
            to: "/auth/sign-in",
            search: {
               redirect: location.href,
            },
         });
      }

      // Return session data for child routes
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
