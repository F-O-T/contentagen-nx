import { createFileRoute, useLocation } from "@tanstack/react-router";
import { Outlet } from "@tanstack/react-router";
import { DashboardLayout } from "@/layout/dashboard-layout";
import { useTRPC } from "@/integrations/clients";
import { useSuspenseQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/_dashboard")({
   component: RouteComponent,
   ssr: true,
   wrapInSuspense: true,
   loader: async ({ context }) => {
      await context.queryClient.ensureQueryData(
         context.trpc.sessionHelper.getSession.queryOptions(),
      );
   },
});

async function RouteComponent() {
   const location = useLocation();
   const trpc = useTRPC();
   const { data: session } = useSuspenseQuery(
      trpc.sessionHelper.getSession.queryOptions(),
   );
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
