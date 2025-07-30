import { createFileRoute } from "@tanstack/react-router";
import { ContentRequestDetailsPage } from "@/pages/content-details/ui/content-request-details-page";

export const Route = createFileRoute("/_dashboard/content/$id")({
   loader: async ({ context, params }) => {
      const { trpc, queryClient } = context;
      const { id } = params;
      await queryClient.ensureQueryData(
         trpc.content.get.queryOptions({
            id,
         }),
      );
   },
   component: ContentRequestDetailsPage,
});
