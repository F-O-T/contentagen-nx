import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@packages/ui/components/card";
import { LayoutDashboard } from "lucide-react";
import { Link } from "@tanstack/react-router";

interface DashboardListCardProps {
	id: string;
	name: string;
	description?: string | null;
	tileCount: number;
	updatedAt: string;
	slug: string;
}

export function DashboardListCard({
	id,
	name,
	description,
	tileCount,
	updatedAt,
	slug,
}: DashboardListCardProps) {
	return (
		<Link to={`/${slug}/analytics/dashboards/${id}`}>
			<Card className="hover:border-primary/50 transition-colors cursor-pointer">
				<CardHeader>
					<div className="flex items-center gap-3">
						<div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
							<LayoutDashboard className="size-5 text-primary" />
						</div>
						<div className="flex-1 min-w-0">
							<CardTitle className="text-base truncate">
								{name}
							</CardTitle>
							{description && (
								<CardDescription className="truncate">
									{description}
								</CardDescription>
							)}
						</div>
					</div>
					<div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
						<span>{tileCount} tiles</span>
						<span>
							Updated{" "}
							{new Date(updatedAt).toLocaleDateString("pt-BR")}
						</span>
					</div>
				</CardHeader>
			</Card>
		</Link>
	);
}
