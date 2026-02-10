import { Avatar, AvatarFallback } from "@packages/ui/components/avatar";
import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@packages/ui/components/empty";
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
import { getInitials } from "@packages/utils/text";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronRight, Mail, UserPlus } from "lucide-react";
import { Fragment } from "react";

const MOCK_MEMBERS = [
	{
		name: "João Silva",
		email: "joao@exemplo.com",
		role: "Admin",
		image: null,
	},
	{
		name: "Maria Santos",
		email: "maria@exemplo.com",
		role: "Membro",
		image: null,
	},
	{
		name: "Pedro Costa",
		email: "pedro@exemplo.com",
		role: "Membro",
		image: null,
	},
];

export const Route = createFileRoute(
	"/_authenticated/$slug/$teamId/_dashboard/settings/organization/members",
)({
	component: MembersPage,
});

function MembersPage() {
	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-semibold font-serif">Membros</h1>
					<p className="text-sm text-muted-foreground mt-1">
						Gerencie os membros da sua organização.
					</p>
				</div>
				<Button size="sm">
					<UserPlus className="size-4 mr-2" />
					Convidar
				</Button>
			</div>

			<section className="space-y-3">
				<div>
					<h2 className="text-lg font-medium">Membros</h2>
					<p className="text-sm text-muted-foreground mt-1">
						{MOCK_MEMBERS.length} membros na organização
					</p>
				</div>
				<ItemGroup>
					{MOCK_MEMBERS.map((member, index) => (
						<Fragment key={`member-${index + 1}`}>
							{index > 0 && <ItemSeparator />}
							<Item variant="muted">
								<ItemMedia>
									<Avatar className="size-8">
										<AvatarFallback className="text-xs">
											{getInitials(member.name)}
										</AvatarFallback>
									</Avatar>
								</ItemMedia>
								<ItemContent className="min-w-0">
									<ItemTitle className="truncate">
										{member.name}
									</ItemTitle>
									<ItemDescription className="truncate">
										{member.email}
									</ItemDescription>
								</ItemContent>
								<ItemActions className="flex items-center gap-2">
									<Badge
										variant={
											member.role === "Admin"
												? "default"
												: "secondary"
										}
									>
										{member.role}
									</Badge>
									<Button size="icon" variant="ghost">
										<ChevronRight className="size-4" />
									</Button>
								</ItemActions>
							</Item>
						</Fragment>
					))}
				</ItemGroup>
			</section>

			<section className="space-y-3">
				<div>
					<h2 className="text-lg font-medium">Convites pendentes</h2>
					<p className="text-sm text-muted-foreground mt-1">
						Convites enviados que ainda não foram aceitos.
					</p>
				</div>
				<Empty>
					<EmptyMedia>
						<Mail className="size-8 text-muted-foreground" />
					</EmptyMedia>
					<EmptyHeader>
						<EmptyTitle>Nenhum convite pendente</EmptyTitle>
						<EmptyDescription>
							Quando você convidar novos membros, os convites
							pendentes aparecerão aqui.
						</EmptyDescription>
					</EmptyHeader>
				</Empty>
			</section>
		</div>
	)
}
