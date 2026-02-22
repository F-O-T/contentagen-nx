import { useSuspenseQuery } from "@tanstack/react-query";
import { orpc } from "@/integrations/orpc/client";

export function useClusters(opts: { limit?: number; page?: number } = {}) {
   return useSuspenseQuery(
      orpc.clusters.list.queryOptions({
         input: { limit: opts.limit ?? 20, page: opts.page ?? 1 },
      }),
   );
}
