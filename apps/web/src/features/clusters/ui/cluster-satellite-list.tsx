import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { toast } from "sonner";
import { orpc } from "@/integrations/orpc/client";
import { useClusterSatellites } from "../hooks/use-cluster-detail";

interface Props {
   pillarId: string;
}

export function ClusterSatelliteList({ pillarId }: Props) {
   const navigate = useNavigate();
   const { slug, teamSlug } = useParams({
      from: "/_authenticated/$slug/$teamSlug/_dashboard/clusters/$clusterId",
   });
   const { data: satellites, refetch } = useClusterSatellites(pillarId);

   const removeMutation = useMutation(
      orpc.relatedContent.removeSatellite.mutationOptions({
         onSuccess: () => {
            toast.success("Satélite removido");
            refetch();
         },
         onError: () => toast.error("Erro ao remover satélite"),
      }),
   );

   if (satellites.length === 0) {
      return (
         <p className="text-sm text-muted-foreground">
            Nenhum post satélite vinculado ainda.
         </p>
      );
   }

   return (
      <div className="space-y-2">
         {satellites.map((rel) => (
            <div
               className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
               key={rel.id}
            >
               <div className="flex-1 min-w-0">
                  <button
                     className="text-sm font-medium truncate hover:underline text-left"
                     onClick={() =>
                        navigate({
                           to: "/$slug/$teamSlug/$contentId",
                           params: {
                              slug,
                              teamSlug,
                              contentId: rel.targetContent.id,
                           },
                        })
                     }
                     type="button"
                  >
                     {rel.targetContent.meta.title}
                  </button>
               </div>
               <div className="flex items-center gap-2 ml-2">
                  <Badge
                     variant={
                        rel.targetContent.status === "published"
                           ? "default"
                           : "outline"
                     }
                  >
                     {rel.targetContent.status}
                  </Badge>
                  <Button
                     disabled={removeMutation.isPending}
                     onClick={() =>
                        removeMutation.mutate({
                           pillarId,
                           satelliteId: rel.targetContent.id,
                        })
                     }
                     size="sm"
                     variant="ghost"
                  >
                     Remover
                  </Button>
               </div>
            </div>
         ))}
      </div>
   );
}
