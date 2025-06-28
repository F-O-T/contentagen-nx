import { createFileRoute, redirect } from "@tanstack/react-router";
import { betterAuthClient } from "@/integrations/better-auth";
export const Route = createFileRoute("/")({
   beforeLoad: async () => {
      const { data } = await betterAuthClient.getSession();
      if (data?.session?.token) {
         throw redirect({ to: "/home" });
      }
      throw redirect({ to: "/auth/sign-in" });
   },
});
