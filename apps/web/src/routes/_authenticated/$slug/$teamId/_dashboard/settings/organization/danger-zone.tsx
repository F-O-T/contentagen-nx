import { Button } from "@packages/ui/components/button";
import {
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemGroup,
	ItemMedia,
	ItemTitle,
} from "@packages/ui/components/item";
import { createFileRoute } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { useAlertDialog } from "@/hooks/use-alert-dialog";

export const Route = createFileRoute(
	"/_authenticated/$slug/$teamId/_dashboard/settings/organization/danger-zone",
)({
	component: OrgDangerZonePage,
});

function OrgDangerZonePage() {
	const { openAlertDialog } = useAlertDialog();

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-semibold font-serif">
					Zona de Perigo
				</h1>
				<p className="text-sm text-muted-foreground mt-1">
					Ações irreversíveis para esta organização. Prossiga com cuidado.
				</p>
			</div>
			<ItemGroup>
				<Item variant="muted">
					<ItemMedia variant="icon">
						<Trash2 className="size-4 text-destructive" />
					</ItemMedia>
					<ItemContent>
						<ItemTitle>Deletar organização</ItemTitle>
						<ItemDescription>
							Remova permanentemente esta organização, todos os projetos e
							dados associados.
						</ItemDescription>
					</ItemContent>
					<ItemActions>
						<Button
							variant="destructive"
							size="sm"
							onClick={() =>
								openAlertDialog({
									title: "Deletar organização",
									description:
										"Tem certeza? Esta ação não pode ser desfeita. Todos os dados serão permanentemente removidos.",
									actionLabel: "Deletar",
									variant: "destructive",
									onAction: async () => {
										// TODO: implement
									},
								})
							}
						>
							Deletar
						</Button>
					</ItemActions>
				</Item>
			</ItemGroup>
		</div>
	)
}
