import { Button } from "@packages/ui/components/button";
import { Input } from "@packages/ui/components/input";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { orpc } from "@/integrations/orpc/client";
import { useSheet } from "@/hooks/use-sheet";

interface Props {
	pillarId: string;
	onSuccess?: () => void;
}

export function AddSatelliteSheet({ pillarId, onSuccess }: Props) {
	const { closeSheet } = useSheet();
	const [search, setSearch] = useState("");

	const { data: contentList } = useSuspenseQuery(
		orpc.content.listAllContent.queryOptions({
			input: { limit: 50, page: 1 },
		}),
	);

	// listAllContent returns { items, limit, page, total, totalPages }
	const items = contentList.items;
	const filtered = items.filter((c) =>
		c.meta.title.toLowerCase().includes(search.toLowerCase()),
	);

	const addMutation = useMutation(
		orpc.relatedContent.addSatellite.mutationOptions({
			onSuccess: () => {
				toast.success("Satélite adicionado!");
				closeSheet();
				onSuccess?.();
			},
			onError: () => toast.error("Erro ao adicionar satélite"),
		}),
	);

	return (
		<div className="space-y-4 p-6">
			<div>
				<h2 className="text-lg font-semibold">Adicionar satélite</h2>
				<p className="text-sm text-muted-foreground mt-1">
					Selecione um conteúdo existente para vincular como satélite.
				</p>
			</div>
			<Input
				placeholder="Buscar conteúdo..."
				value={search}
				onChange={(e) => setSearch(e.target.value)}
			/>
			<div className="space-y-1 max-h-[50vh] overflow-y-auto">
				{filtered.map((c) => (
					<button
						key={c.id}
						type="button"
						className="w-full text-left p-3 rounded-md hover:bg-accent text-sm"
						onClick={() => addMutation.mutate({ pillarId, satelliteId: c.id })}
						disabled={addMutation.isPending}
					>
						{c.meta.title}
					</button>
				))}
				{filtered.length === 0 && (
					<p className="text-sm text-muted-foreground text-center py-4">
						Nenhum conteúdo encontrado.
					</p>
				)}
			</div>
		</div>
	);
}