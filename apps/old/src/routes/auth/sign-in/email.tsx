import { createFileRoute, redirect } from "@tanstack/react-router";
import { getQueryClient, trpc } from "@/integrations/clients";
import { SignInEmailPage } from "@/pages/sign-in/ui/sign-in-email-page";

export const Route = createFileRoute("/auth/sign-in/email")({
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
   return <SignInEmailPage />;
}
