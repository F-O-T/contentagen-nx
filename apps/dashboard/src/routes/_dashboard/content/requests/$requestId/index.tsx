import { createFileRoute } from "@tanstack/react-router";
import { ContentRequestDetailsPage } from "@/pages/content-request-details/ui/content-request-details-page";
import { createQueryKey } from "@packages/eden";

export const Route = createFileRoute(
  "/_dashboard/content/requests/$requestId/",
)({
  loader: async ({ context, params }) => {
    const { eden, queryClient } = context;
    const { requestId } = params;
    await queryClient.ensureQueryData({
      queryFn: async () =>
        await eden.api.v1.content.request.details({ id: requestId }).get(),
      queryKey: createQueryKey(
        "eden.api.v1.content.request.details({ id: requestId }).get()",
      ),
    });
  },
  component: ContentRequestDetailsPage,
});
