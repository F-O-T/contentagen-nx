import { Button } from "@packages/ui/components/button";
import {
   Tabs,
   TabsContent,
   TabsList,
   TabsTrigger,
} from "@packages/ui/components/tabs";
import { useNavigate, useParams } from "@tanstack/react-router";
import { ExternalLink, Plus } from "lucide-react";
import { useSheet } from "@/hooks/use-sheet";
import { useClusterDetail } from "../hooks/use-cluster-detail";
import { AddSatelliteSheet } from "./add-satellite-sheet";
import { ClusterEmbedPanel } from "./cluster-embed-panel";
import { ClusterSatelliteList } from "./cluster-satellite-list";

export function ClusterDetailSection() {
   const { slug, teamSlug, clusterId } = useParams({
      from: "/_authenticated/$slug/$teamSlug/_dashboard/clusters/$clusterId",
   });
   const navigate = useNavigate();
   const { openSheet } = useSheet();
   const { data: cluster, refetch } = useClusterDetail(clusterId);

   const openPillar = () =>
      navigate({
         to: "/$slug/$teamSlug/$contentId",
         params: { slug, teamSlug, contentId: cluster.id },
      });

   return (
      <div className="space-y-6">
         <div className="flex items-start justify-between">
            <div>
               <h1 className="text-2xl font-semibold font-serif">
                  {cluster.meta.title}
               </h1>
               {cluster.clusterConfig?.mode && (
                  <p className="text-sm text-muted-foreground mt-0.5 capitalize">
                     {cluster.clusterConfig.mode}
                  </p>
               )}
            </div>
            <Button onClick={openPillar} size="sm" variant="outline">
               <ExternalLink className="size-4 mr-2" />
               Editar pillar
            </Button>
         </div>

         <Tabs defaultValue="satellites">
            <TabsList>
               <TabsTrigger value="satellites">Posts Satélite</TabsTrigger>
               <TabsTrigger value="embed">Embed</TabsTrigger>
            </TabsList>

            <TabsContent className="space-y-4 pt-4" value="satellites">
               <div className="flex justify-end">
                  <Button
                     onClick={() =>
                        openSheet({
                           children: (
                              <AddSatelliteSheet
                                 onSuccess={() => refetch()}
                                 pillarId={clusterId}
                              />
                           ),
                        })
                     }
                     size="sm"
                  >
                     <Plus className="size-4 mr-2" />
                     Adicionar satélite
                  </Button>
               </div>
               <ClusterSatelliteList pillarId={clusterId} />
            </TabsContent>

            <TabsContent className="pt-4" value="embed">
               <ClusterEmbedPanel cluster={cluster} onSaved={() => refetch()} />
            </TabsContent>
         </Tabs>
      </div>
   );
}
