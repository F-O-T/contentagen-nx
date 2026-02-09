import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@packages/ui/components/tabs";
import { createFileRoute } from "@tanstack/react-router";
import { FormAnalytics } from "@/features/forms/ui/form-analytics";
import { SubmissionsTable } from "@/features/forms/ui/submissions-table";

export const Route = createFileRoute(
	"/_authenticated/$slug/_dashboard/$teamId/forms/$formId/submissions",
)({
	component: SubmissionsPage,
});

function SubmissionsPage() {
	const { formId } = Route.useParams();

	return (
		<Tabs defaultValue="submissions">
			<TabsList>
				<TabsTrigger value="submissions">Submissões</TabsTrigger>
				<TabsTrigger value="analytics">Análise</TabsTrigger>
			</TabsList>
			<TabsContent value="submissions">
				<SubmissionsTable formId={formId} />
			</TabsContent>
			<TabsContent value="analytics">
				<FormAnalytics formId={formId} />
			</TabsContent>
		</Tabs>
	)
}
