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
import { Switch } from "@packages/ui/components/switch";
import { Button } from "@packages/ui/components/button";
import { createFileRoute } from "@tanstack/react-router";
import { Clock, Pencil, Shield, Wifi } from "lucide-react";

export const Route = createFileRoute(
	"/_authenticated/$slug/$teamId/_dashboard/settings/organization/security",
)({
	component: OrganizationSecurityPage,
});

function OrganizationSecurityPage() {
	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-semibold font-serif">Seguranca</h1>
				<p className="text-sm text-muted-foreground mt-1">
					Politicas de seguranca aplicadas a todos os membros da organizacao.
				</p>
			</div>
			<ItemGroup>
				<Item variant="muted">
					<ItemMedia variant="icon">
						<Shield className="size-4" />
					</ItemMedia>
					<ItemContent>
						<ItemTitle>Exigir 2FA</ItemTitle>
						<ItemDescription>
							Forcar autenticacao de dois fatores para todos os membros
						</ItemDescription>
					</ItemContent>
					<ItemActions>
						<Switch checked={false} />
					</ItemActions>
				</Item>
				<ItemSeparator />
				<Item variant="muted">
					<ItemMedia variant="icon">
						<Clock className="size-4" />
					</ItemMedia>
					<ItemContent>
						<ItemTitle>Timeout de sessao</ItemTitle>
						<ItemDescription>4 horas</ItemDescription>
					</ItemContent>
					<ItemActions>
						<Button size="icon" variant="ghost">
							<Pencil className="size-4" />
						</Button>
					</ItemActions>
				</Item>
				<ItemSeparator />
				<Item variant="muted">
					<ItemMedia variant="icon">
						<Wifi className="size-4" />
					</ItemMedia>
					<ItemContent>
						<ItemTitle>IPs permitidos</ItemTitle>
						<ItemDescription>Todos os IPs</ItemDescription>
					</ItemContent>
					<ItemActions>
						<Button size="icon" variant="ghost">
							<Pencil className="size-4" />
						</Button>
					</ItemActions>
				</Item>
			</ItemGroup>
		</div>
	)
}
