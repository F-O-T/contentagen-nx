import { createFileRoute } from "@tanstack/react-router";
import { SubmissionsTable } from "@/features/forms/ui/submissions-table";

export const Route = createFileRoute(
	"/_authenticated/$slug/_dashboard/forms/$formId/submissions",
)({
	component: SubmissionsPage,
});

function SubmissionsPage() {
	const { formId } = Route.useParams();

	return <SubmissionsTable formId={formId} />;
}
