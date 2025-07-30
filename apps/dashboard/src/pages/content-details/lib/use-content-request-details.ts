import { useSuspenseQuery } from "@tanstack/react-query";
import { useParams, useRouteContext } from "@tanstack/react-router";
import { useTRPC } from "@/integrations/clients";
export function useContentRequestDetails() {
   const { id } = useParams({
      from: "/_dashboard/content/$id",
   });
   const trpc = useTRPC();
   const { data, isLoading, error } = useSuspenseQuery(
      trpc.content.get.queryOptions({
         id,
      }),
   );

   return {
      data,
      isLoading,
      error,
   };
}
