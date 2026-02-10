import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import {
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemGroup,
	ItemMedia,
	ItemSeparator,
	ItemTitle,
} from "@packages/ui/components/item";
import { createFileRoute } from "@tanstack/react-router";
import {
	BarChart3,
	FileText,
	Globe,
	Layout,
	MessageSquare,
	Search,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Fragment } from "react";

export const Route = createFileRoute(
	"/_authenticated/$slug/$teamId/_dashboard/settings/project/integrations",
)({
	component: ProjectIntegrationsPage,
});

interface Integration {
	name: string;
	description: string;
	icon: LucideIcon;
	connected: boolean;
}

const integrations: Integration[] = [
	{
		name: "WordPress",
		description: "Publique conteúdo diretamente no WordPress",
		icon: Globe,
		connected: false,
	},
	{
		name: "Webflow",
		description: "Sincronize conteúdo com o Webflow CMS",
		icon: Layout,
		connected: false,
	},
	{
		name: "Ghost",
		description: "Publique no Ghost CMS",
		icon: FileText,
		connected: false,
	},
	{
		name: "Google Search Console",
		description: "Monitore performance de busca",
		icon: Search,
		connected: false,
	},
	{
		name: "Google Analytics",
		description: "Acompanhe métricas de acesso",
		icon: BarChart3,
		connected: false,
	},
	{
		name: "Slack",
		description: "Receba notificações de conteúdo no Slack",
		icon: MessageSquare,
		connected: false,
	},
];

function ProjectIntegrationsPage() {
	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-semibold font-serif">Integrações</h1>
				<p className="text-sm text-muted-foreground mt-1">
					Conecte serviços externos ao seu projeto.
				</p>
			</div>
			<ItemGroup>
				{integrations.map((integration, index) => (
					<Fragment key={integration.name}>
						{index > 0 && <ItemSeparator />}
						<Item variant="muted">
							<ItemMedia variant="icon">
								<integration.icon className="size-4" />
							</ItemMedia>
							<ItemContent className="min-w-0">
								<ItemTitle>{integration.name}</ItemTitle>
								<ItemDescription>
									{integration.description}
								</ItemDescription>
							</ItemContent>
							<ItemActions className="flex items-center gap-2">
								<Badge variant="secondary">Não conectado</Badge>
								<Button disabled size="sm" variant="outline">
									Conectar
								</Button>
							</ItemActions>
						</Item>
					</Fragment>
				))}
			</ItemGroup>
		</div>
	)
}
