import { createFileRoute } from "@tanstack/react-router";
import { CompetitorDetailsPage } from "@/pages/competitor-details/ui/competitor-details-page";

export const Route = createFileRoute("/_dashboard/competitors/$id")({
   loader: async ({ context, params }) => {
      const { trpc, queryClient } = context;
      const { id } = params;
      await queryClient.ensureQueryData(
         trpc.competitor.get.queryOptions({
            id,
         }),
      );
   },
   component: CompetitorDetailsPage,
});
