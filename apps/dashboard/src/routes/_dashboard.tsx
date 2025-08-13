import {
   createFileRoute,
   useLocation,
   useRouter,
} from "@tanstack/react-router";
import { Outlet } from "@tanstack/react-router";
import { DashboardLayout } from "@/layout/dashboard-layout";
import { betterAuthClient, useTRPC } from "@/integrations/clients";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useIsomorphicLayoutEffect } from "@packages/ui/hooks/use-isomorphic-layout-effect";
import { toast } from "sonner";
export const Route = createFileRoute("/_dashboard")({
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
   //TODO: mover o setOrganization para o databaseHooks com o betterAuth

   useQuery({
      queryKey: ["activeOrganization"],
      queryFn: async () => {
         const orgs = await betterAuthClient.organization.list();
         if (!orgs.data) {
            throw new Error("Failed to fetch organizations");
         }
         if (!orgs?.data[0]?.id) {
            throw new Error("No organizations found");
         }
         await betterAuthClient.organization.setActive({
            organizationId: orgs?.data[0]?.id,
         });
         const { data, error } =
            await betterAuthClient.organization.getFullOrganization();
         if (error) throw new Error("Failed to load organization");
         return data;
      },
   });

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

   return (
      <DashboardLayout session={session}>
         <div
            className="duration-700 animate-in slide-in-from-bottom-4 fade-in h-full w-full"
            key={location.pathname}
         >
            <Outlet />
         </div>
      </DashboardLayout>
   );
}
