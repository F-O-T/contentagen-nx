import { useIsMobile } from "@packages/ui/hooks/use-mobile";
import { createFileRoute, Navigate, useParams } from "@tanstack/react-router";
import { DataManagementMobileNav } from "@/layout/dashboard/ui/data-management-mobile-nav";

export const Route = createFileRoute(
	"/_authenticated/$slug/_dashboard/$teamId/analytics/data-management/",
)({
	component: DataManagementIndexRoute,
});

function DataManagementIndexRoute() {
	const isMobile = useIsMobile();
	const { slug, teamId } = useParams({ strict: false }) as {
		slug: string;
		teamId: string;
	};

	if (!isMobile) {
		return (
			<Navigate
				params={{ slug, teamId }}
				replace
				to="/$slug/$teamId/analytics/data-management/event-definitions"
			/>
		);
	}

	return <DataManagementMobileNav />;
}
