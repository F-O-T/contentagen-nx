import { Button } from "@packages/ui/components/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@packages/ui/components/tabs";
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
			to: "/$slug/$teamSlug/content/$contentId/edit",
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
				<Button variant="outline" size="sm" onClick={openPillar}>
					<ExternalLink className="size-4 mr-2" />
					Editar pillar
				</Button>
			</div>

			<Tabs defaultValue="satellites">
				<TabsList>
					<TabsTrigger value="satellites">Posts Satélite</TabsTrigger>
					<TabsTrigger value="embed">Embed</TabsTrigger>
				</TabsList>

				<TabsContent value="satellites" className="space-y-4 pt-4">
					<div className="flex justify-end">
						<Button
							size="sm"
							onClick={() =>
								openSheet({
									children: (
										<AddSatelliteSheet
											pillarId={clusterId}
											onSuccess={() => refetch()}
										/>
									),
								})
							}
						>
							<Plus className="size-4 mr-2" />
							Adicionar satélite
						</Button>
					</div>
					<ClusterSatelliteList pillarId={clusterId} />
				</TabsContent>

				<TabsContent value="embed" className="pt-4">
					<ClusterEmbedPanel cluster={cluster} onSaved={() => refetch()} />
				</TabsContent>
			</Tabs>
		</div>
	);
}