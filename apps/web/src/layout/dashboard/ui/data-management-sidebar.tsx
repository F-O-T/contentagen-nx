import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@packages/ui/components/collapsible";
import { Input } from "@packages/ui/components/input";
import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@packages/ui/components/sidebar";
import { cn } from "@packages/ui/lib/utils";
import { Link, useLocation, useParams } from "@tanstack/react-router";
import { ChevronDown, Search } from "lucide-react";
import { useState } from "react";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import type {
	SettingsNavItemDef,
	SettingsNavSection,
} from "./settings-nav-items";
import { dataManagementNavSections } from "./data-management-nav-items";

function matchesSearch(item: SettingsNavItemDef, query: string): boolean {
	return item.title.toLowerCase().includes(query.toLowerCase());
}

function filterSection(
	section: SettingsNavSection,
	query: string,
): SettingsNavSection {
	if (!query) return section;
	const filteredItems = section.items.filter((item) =>
		matchesSearch(item, query),
	);
	return { ...section, items: filteredItems };
}

function NavItem({
	item,
	slug,
	teamId,
	pathname,
}: {
	item: SettingsNavItemDef;
	slug: string;
	teamId: string;
	pathname: string;
}) {
	const resolvedHref = item.href
		.replace("$slug", slug)
		.replace("$teamId", teamId);
	const isActive = pathname === resolvedHref;

	return (
		<SidebarMenuItem>
			<SidebarMenuButton
				asChild
				className={cn(
					isActive && "bg-primary/10 text-primary rounded-lg",
				)}
			>
				<Link params={{ slug, teamId }} to={item.href}>
					{item.icon && <item.icon className="size-4" />}
					<span>{item.title}</span>
				</Link>
			</SidebarMenuButton>
		</SidebarMenuItem>
	);
}

function NavSection({
	section,
	slug,
	teamId,
	pathname,
	forceOpen,
}: {
	section: SettingsNavSection;
	slug: string;
	teamId: string;
	pathname: string;
	forceOpen: boolean;
}) {
	const [isOpen, setIsOpen] = useState(section.defaultOpen);
	const effectiveOpen = forceOpen || isOpen;

	if (section.items.length === 0) return null;

	return (
		<Collapsible onOpenChange={setIsOpen} open={effectiveOpen}>
			<SidebarGroup className="py-0">
				<CollapsibleTrigger className="flex w-full items-center justify-between px-3 py-2 group">
					<span className="text-xs font-semibold text-sidebar-foreground/70 uppercase tracking-wider">
						{section.label}
					</span>
					<ChevronDown
						className={cn(
							"size-3.5 text-sidebar-foreground/50 transition-transform",
							!effectiveOpen && "-rotate-90",
						)}
					/>
				</CollapsibleTrigger>
				<CollapsibleContent>
					<SidebarGroupContent>
						<SidebarMenu>
							{section.items.map((item) => (
								<NavItem
									item={item}
									key={item.id}
									pathname={pathname}
									slug={slug}
									teamId={teamId}
								/>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</CollapsibleContent>
			</SidebarGroup>
		</Collapsible>
	);
}

export function DataManagementSidebar() {
	const { activeOrganization } = useActiveOrganization();
	const { teamId } = useParams({ strict: false });
	const { pathname } = useLocation();
	const [search, setSearch] = useState("");

	const filteredSections = dataManagementNavSections.map((section) =>
		filterSection(section, search),
	);

	return (
		<>
			<div className="px-3 py-2">
				<div className="relative">
					<Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground pointer-events-none" />
					<Input
						className="pl-8 h-9 bg-sidebar text-sm"
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Pesquisar dados..."
						value={search}
					/>
				</div>
			</div>
			{filteredSections.map((section) => (
				<NavSection
					forceOpen={search.length > 0}
					key={section.id}
					pathname={pathname}
					section={section}
					slug={activeOrganization.slug}
					teamId={teamId ?? ""}
				/>
			))}
		</>
	);
}
