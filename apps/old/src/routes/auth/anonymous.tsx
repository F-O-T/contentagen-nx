import { createFileRoute, redirect } from "@tanstack/react-router";
import { getQueryClient, trpc } from "@/integrations/clients";

import { AnonymousPage } from "@/pages/anonymous/ui/anonymous-page";

export const Route = createFileRoute("/auth/anonymous")({
   beforeLoad: async () => {
      const queryClient = getQueryClient();
      const session = await queryClient
         .fetchQuery(trpc.session.getSession.queryOptions())
         .catch(() => null);
      if (session) {
         throw redirect({ to: "/auth/callback" });
      }
   },
   component: RouteComponent,
});

function RouteComponent() {
   return <AnonymousPage />;
}
