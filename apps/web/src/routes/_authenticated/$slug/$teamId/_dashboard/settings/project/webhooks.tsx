import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@packages/ui/components/button";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@packages/ui/components/empty";
import { Plus, Webhook } from "lucide-react";

export const Route = createFileRoute(
	"/_authenticated/$slug/$teamId/_dashboard/settings/project/webhooks",
)({
	component: ProjectWebhooksPage,
});

function ProjectWebhooksPage() {
	function handleCreateWebhook() {
		console.log("TODO: open create webhook sheet");
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-semibold font-serif">Webhooks</h1>
					<p className="text-sm text-muted-foreground mt-1">
						Configure endpoints para receber eventos do projeto.
					</p>
				</div>
				<Button size="sm" onClick={handleCreateWebhook}>
					<Plus className="size-4 mr-2" />
					Criar endpoint
				</Button>
			</div>
			<Empty className="border-none py-8">
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<Webhook className="size-6" />
					</EmptyMedia>
					<EmptyTitle>Nenhum webhook configurado</EmptyTitle>
					<EmptyDescription>
						Webhooks permitem que aplicações externas recebam
						eventos em tempo real.
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		</div>
	)
}
