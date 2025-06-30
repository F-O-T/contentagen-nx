import { createQueryKey } from "@packages/eden";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";

export function useContentList() {
   const { eden } = useRouteContext({
      from: "/_dashboard/content/",
   });
   const { data, isLoading, error } = useSuspenseQuery({
      queryFn: async () => {
         const response = await eden.api.v1.content.request.list.get({
            query: {},
         });
         return { ...response };
      },
      queryKey: createQueryKey("eden.api.v1.content.request.get"),
      select: (data) => data.data,
   });

   return {
      requests: data?.requests || [],
      isLoading,
      error,
   };
}
