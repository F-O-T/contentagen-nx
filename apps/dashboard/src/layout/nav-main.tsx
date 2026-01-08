import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@packages/ui/components/sidebar";
import { Link, useLocation } from "@tanstack/react-router";
import { FileText, Home, PenTool } from "lucide-react";

export function NavMain() {
	const { pathname, searchStr } = useLocation();
	const { state } = useSidebar();

	const isActive = (url: string) => {
		if (!url) return false;

		const resolvedUrl = url.replace("$slug", pathname.split("/")[1] || "");

		if (resolvedUrl.includes("?")) {
			const [path, params] = resolvedUrl.split("?");
			return pathname === path && searchStr === `?${params}`;
		}

		return pathname.startsWith(resolvedUrl) && !searchStr;
	};

	const mainItems = [
		{
			icon: Home,
			id: "home",
			title: "Início",
			url: "/$slug/home",
		},
		{
			icon: PenTool,
			id: "writers",
			title: "Escritores",
			url: "/$slug/writers",
		},
		{
			icon: FileText,
			id: "content",
			title: "Conteúdos",
			url: "/$slug/content",
		},
	];

	const renderNavItem = (item: {
		icon: typeof Home;
		id: string;
		title: string;
		url: string;
	}) => {
		const Icon = item.icon;

		return (
			<SidebarMenuItem key={item.id}>
				<SidebarMenuButton
					asChild
					className={
						isActive(item.url) ? "bg-primary/10 text-primary rounded-lg" : ""
					}
					tooltip={item.title}
				>
					<Link params={{}} to={item.url}>
						<Icon />
						<span>{item.title}</span>
					</Link>
				</SidebarMenuButton>
			</SidebarMenuItem>
		);
	};

	return (
		<SidebarGroup className="group-data-[collapsible=icon]">
			<SidebarGroupContent className="flex flex-col gap-2">
				{state === "expanded" && (
					<SidebarGroupLabel>
						{"Principal"}
					</SidebarGroupLabel>
				)}
				<SidebarMenu>
					{mainItems.map((item) => renderNavItem(item))}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	);
}
