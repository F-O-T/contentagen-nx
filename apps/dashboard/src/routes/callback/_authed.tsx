import {
   createFileRoute,
   useLocation,
   useRouter,
} from "@tanstack/react-router";
import { Outlet } from "@tanstack/react-router";
import { useTRPC } from "@/integrations/clients";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useIsomorphicLayoutEffect } from "@packages/ui/hooks/use-isomorphic-layout-effect";
import { toast } from "sonner";
export const Route = createFileRoute("/callback/_authed")({
   component: RouteComponent,
   wrapInSuspense: true,
   errorComponent: () => <>error</>,
   loader: async ({ context }) => {
      await context.queryClient.prefetchQuery(
         context.trpc.sessionHelper.getSession.queryOptions(),
      );
   },
});

function RouteComponent() {
   const location = useLocation();
   const router = useRouter();
   const trpc = useTRPC();
   const { data: session, error } = useSuspenseQuery(
      trpc.sessionHelper.getSession.queryOptions(),
   );

   useIsomorphicLayoutEffect(() => {
      if (error) {
         toast.error("Failed to fetch session data.");
         router.navigate({
            to: "/auth/sign-in",
            search: location.search,
            replace: true,
         });
         return;
      }
      if (!session) {
         toast.error("You must be logged in to access this page.");
         router.navigate({
            to: "/auth/sign-in",
            search: location.search,
            replace: true,
         });
      }
   }, [session, location]);

   return <Outlet />;
}
