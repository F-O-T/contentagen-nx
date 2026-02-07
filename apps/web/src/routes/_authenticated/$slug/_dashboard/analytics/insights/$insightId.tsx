import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
	"/_authenticated/$slug/_dashboard/analytics/insights/$insightId",
)({
	component: EditInsightPage,
});

function EditInsightPage() {
	const { insightId } = Route.useParams();
	return (
		<main className="flex flex-col gap-4">
			<h1 className="text-3xl font-bold tracking-tight font-serif">Editar Insight</h1>
			<p className="text-muted-foreground">ID: {insightId}</p>
		</main>
	);
}
