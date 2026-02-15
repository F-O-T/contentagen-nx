import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@packages/ui/components/avatar";
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
import { Skeleton } from "@packages/ui/components/skeleton";
import { getInitials } from "@packages/utils/text";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronRight, Mail, UserPlus } from "lucide-react";
import { Fragment, Suspense } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { orpc } from "@/integrations/orpc/client";

export const Route = createFileRoute(
	"/_authenticated/$slug/$teamId/_dashboard/settings/organization/members",
)({
	component: MembersPage,
});

// ============================================
// Skeleton
// ============================================

function MembersSkeleton() {
	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<Skeleton className="h-8 w-32" />
					<Skeleton className="h-4 w-64 mt-1" />
				</div>
				<Skeleton className="h-8 w-24" />
			</div>

			<div className="space-y-3">
				<div>
					<Skeleton className="h-6 w-24" />
					<Skeleton className="h-4 w-48 mt-1" />
				</div>
				<div className="space-y-1">
					<Skeleton className="h-16 w-full rounded-lg" />
					<Skeleton className="h-16 w-full rounded-lg" />
					<Skeleton className="h-16 w-full rounded-lg" />
				</div>
			</div>

			<div className="space-y-3">
				<div>
					<Skeleton className="h-6 w-40" />
					<Skeleton className="h-4 w-64 mt-1" />
				</div>
				<Skeleton className="h-24 w-full rounded-lg" />
			</div>
		</div>
	);
}

// ============================================
// Error Fallback
// ============================================

function MembersErrorFallback({ resetErrorBoundary }: FallbackProps) {
	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-semibold font-serif">Membros</h1>
				<p className="text-sm text-muted-foreground mt-1">
					Gerencie os membros da sua organização.
				</p>
			</div>
			<div className="flex flex-col items-center justify-center py-12 text-center">
				<p className="text-sm text-muted-foreground mb-4">
					Não foi possível carregar os membros da organização
				</p>
				<Button variant="outline" onClick={resetErrorBoundary}>
					Tentar novamente
				</Button>
			</div>
		</div>
	);
}

// ============================================
// Main Content Component
// ============================================

function MembersContent() {
	const { data: members } = useSuspenseQuery(
		orpc.organization.getMembers.queryOptions({}),
	);

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
						{members.length} {members.length === 1 ? "membro" : "membros"} na organização
					</p>
				</div>
				<ItemGroup>
					{members.map((member, index) => (
						<Fragment key={`member-${member.id}`}>
							{index > 0 && <ItemSeparator />}
							<Item variant="muted">
								<ItemMedia>
									<Avatar className="size-8">
										<AvatarImage
											alt={member.name}
											src={member.image || undefined}
										/>
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
											member.role === "owner"
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
	);
}

// ============================================
// Page Component
// ============================================

function MembersPage() {
	return (
		<ErrorBoundary FallbackComponent={MembersErrorFallback}>
			<Suspense fallback={<MembersSkeleton />}>
				<MembersContent />
			</Suspense>
		</ErrorBoundary>
	);
}
