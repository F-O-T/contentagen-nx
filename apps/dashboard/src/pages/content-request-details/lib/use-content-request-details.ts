import { createQueryKey } from "@packages/eden";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useParams, useRouteContext } from "@tanstack/react-router";

export function useContentRequestDetails() {
   const { eden } = useRouteContext({
      from: "/_dashboard/content/requests/$requestId/",
   });
   const { requestId } = useParams({
      from: "/_dashboard/content/requests/$requestId/",
   });

   const { data, isLoading, error } = useSuspenseQuery({
      queryFn: async () => {
         const response = await eden.api.v1.content.request
            .details({ id: requestId })
            .get();
         return response;
      },
      queryKey: createQueryKey("eden.api.v1.content.request.details", {
         id: requestId,
      }),
      select: (data) => data.data,
   });

   return {
      request: data?.request,
      generatedContent: data?.request?.generatedContent,
      agent: data?.request,
      isLoading,
      error,
   };
}
