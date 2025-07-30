import { createFileRoute } from "@tanstack/react-router";
import { ContentRequestDetailsPage } from "@/pages/content-details/ui/content-request-details-page";

export const Route = createFileRoute(
   "/_dashboard/content/requests/$requestId/",
)({
   loader: async ({ context, params }) => {
      const { trpc, queryClient } = context;
      const { requestId } = params;
      await queryClient.ensureQueryData(
         trpc.content.get.queryOptions({
            id: requestId,
         }),
      );
   },
   component: ContentRequestDetailsPage,
});
