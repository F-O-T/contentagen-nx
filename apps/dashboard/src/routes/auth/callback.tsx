import { createFileRoute, redirect } from "@tanstack/react-router";
import { getQueryClient, trpc } from "@/integrations/clients";

export const Route = createFileRoute("/auth/callback")({
   beforeLoad: async () => {
      const queryClient = getQueryClient();

      // Fetch user's organizations to get the correct slug
      const organizations = await queryClient.fetchQuery(
         trpc.organization.getOrganizations.queryOptions(),
      );

      const firstSlug = organizations[0]?.slug;

      if (firstSlug) {
         throw redirect({
            params: { slug: firstSlug },
            to: "/$slug/home",
         });
      }

      // Fallback if no organization exists (shouldn't happen normally)
      throw redirect({ to: "/auth/sign-in" });
   },
   component: () => null,
});
