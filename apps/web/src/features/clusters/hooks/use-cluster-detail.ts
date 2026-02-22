import { useSuspenseQuery } from "@tanstack/react-query";
import { orpc } from "@/integrations/orpc/client";

export function useClusterDetail(clusterId: string) {
   return useSuspenseQuery(
      orpc.clusters.getById.queryOptions({ input: { id: clusterId } }),
   );
}

export function useClusterSatellites(pillarId: string) {
   return useSuspenseQuery(
      orpc.relatedContent.listSatellites.queryOptions({
         input: { pillarId },
      }),
   );
}
