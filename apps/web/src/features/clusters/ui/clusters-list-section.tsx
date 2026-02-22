import { DataTable } from "@packages/ui/components/data-table";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyMedia,
	EmptyTitle,
} from "@packages/ui/components/empty";
import { useNavigate, useParams } from "@tanstack/react-router";
import { Network } from "lucide-react";
import { useMemo } from "react";
import { useSheet } from "@/hooks/use-sheet";
import { useClusters } from "../hooks/use-clusters";
import { CreateClusterSheet } from "./create-cluster-sheet";
import { createClustersColumns } from "./clusters-table-columns";

export function ClustersListSection() {
	const navigate = useNavigate();
	const { slug, teamSlug } = useParams({
		from: "/_authenticated/$slug/$teamSlug/_dashboard/clusters/",
	});
	const { openSheet } = useSheet();
	const { data } = useClusters();

	const columns = useMemo(
		() =>
			createClustersColumns({
				onOpen: (id) =>
					navigate({
						to: "/$slug/$teamSlug/clusters/$clusterId",
						params: { slug, teamSlug, clusterId: id },
					}),
			}),
		[navigate, slug, teamSlug],
	);

	if (data.length === 0) {
		return (
			<Empty>
				<EmptyMedia>
					<Network className="size-8 text-muted-foreground" />
				</EmptyMedia>
				<EmptyContent>
					<EmptyTitle>Nenhum cluster ainda</EmptyTitle>
					<EmptyDescription>
						Crie seu primeiro cluster para organizar conteúdos relacionados.
					</EmptyDescription>
				</EmptyContent>
				<button
					type="button"
					className="text-sm underline text-primary"
					onClick={() => openSheet({ children: <CreateClusterSheet /> })}
				>
					Criar cluster
				</button>
			</Empty>
		);
	}

	return <DataTable columns={columns} data={data} />;
}
