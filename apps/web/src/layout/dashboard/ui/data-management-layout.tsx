import { Button } from "@packages/ui/components/button";
import {
	Sidebar,
	SidebarContent,
	SidebarHeader,
	SidebarInset,
	SidebarManager,
	SidebarProvider,
} from "@packages/ui/components/sidebar";
import { useIsMobile } from "@packages/ui/hooks/use-mobile";
import { Link, useLocation, useParams } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import type * as React from "react";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { DataManagementMobileNav } from "./data-management-mobile-nav";
import { DataManagementSidebar } from "./data-management-sidebar";

interface DataManagementLayoutProps {
	children: React.ReactNode;
}

export function DataManagementLayout({ children }: DataManagementLayoutProps) {
	const isMobile = useIsMobile();
	const { pathname } = useLocation();
	const { activeOrganization } = useActiveOrganization();
	const { teamId } = useParams({ strict: false });

	const isIndexRoute = pathname.endsWith("/data-management");

	if (isMobile) {
		if (isIndexRoute) {
			return <DataManagementMobileNav />;
		}

		return (
			<div className="flex h-full flex-col gap-4">
				<Button asChild className="w-fit" size="sm" variant="ghost">
					<Link
						params={{
							slug: activeOrganization.slug,
							teamId: teamId ?? "",
						}}
						to="/$slug/$teamId/analytics/data-management"
					>
						<ChevronLeft className="size-4 mr-1" />
						Gerenciamento de Dados
					</Link>
				</Button>
				<div className="flex-1">{children}</div>
			</div>
		);
	}

	return (
		<SidebarProvider
			className="w-full -m-4"
			style={
				{
					"--sidebar-width": "16rem",
				} as React.CSSProperties
			}
		>
			<SidebarManager name="data-management">
				<Sidebar
					className="sticky top-0 h-svh border-r"
					collapsible="none"
				>
					<SidebarHeader className="px-3 pt-3 pb-0">
						<div className="flex items-center gap-2">
							<Button
								asChild
								className="w-fit"
								size="sm"
								variant="ghost"
							>
								<Link
									params={{
										slug: activeOrganization.slug,
										teamId: teamId ?? "",
									}}
									to="/$slug/$teamId/analytics/dashboards"
								>
									<ChevronLeft className="size-4 mr-1" />
									Gerenciamento de Dados
								</Link>
							</Button>
						</div>
					</SidebarHeader>
					<SidebarContent>
						<DataManagementSidebar />
					</SidebarContent>
				</Sidebar>
			</SidebarManager>
			<SidebarInset>
				<main className="flex-1 min-w-0 p-6">{children}</main>
			</SidebarInset>
		</SidebarProvider>
	);
}
