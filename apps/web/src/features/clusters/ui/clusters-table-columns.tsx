import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import type { Content } from "@packages/database/schemas/content";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export type ClusterRow = Pick<
	Content,
	"id" | "meta" | "status" | "createdAt" | "clusterConfig"
>;

export function createClustersColumns(opts: {
	onOpen: (id: string) => void;
}): ColumnDef<ClusterRow>[] {
	return [
		{
			accessorKey: "meta.title",
			header: "Título",
			cell: ({ row }) => (
				<button
					type="button"
					className="text-left font-medium hover:underline"
					onClick={() => opts.onOpen(row.original.id)}
				>
					{row.original.meta.title}
				</button>
			),
		},
		{
			accessorKey: "clusterConfig.mode",
			header: "Tipo",
			cell: ({ row }) => {
				const mode = row.original.clusterConfig?.mode;
				return mode ? (
					<Badge variant="secondary">{mode}</Badge>
				) : (
					<span className="text-muted-foreground text-sm">—</span>
				);
			},
		},
		{
			accessorKey: "status",
			header: "Status",
			cell: ({ row }) => (
				<Badge
					variant={
						row.original.status === "published" ? "default" : "outline"
					}
				>
					{row.original.status}
				</Badge>
			),
		},
		{
			accessorKey: "clusterConfig.embedEnabled",
			header: "Embed",
			cell: ({ row }) =>
				row.original.clusterConfig?.embedEnabled ? (
					<Badge variant="default">Ativo</Badge>
				) : (
					<span className="text-muted-foreground text-sm">—</span>
				),
		},
		{
			accessorKey: "createdAt",
			header: "Criado em",
			cell: ({ row }) =>
				format(new Date(row.original.createdAt), "dd MMM yyyy", {
					locale: ptBR,
				}),
		},
		{
			id: "actions",
			cell: ({ row }) => (
				<Button
					variant="ghost"
					size="sm"
					onClick={() => opts.onOpen(row.original.id)}
				>
					Ver
				</Button>
			),
		},
	];
}
