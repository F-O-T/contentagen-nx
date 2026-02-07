import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@packages/ui/components/tabs";
import { createFileRoute } from "@tanstack/react-router";
import { EventCatalogTable } from "@/features/analytics/ui/event-catalog-table";

export const Route = createFileRoute(
	"/_authenticated/$slug/_dashboard/analytics/data-management",
)({
	component: DataManagementPage,
});

// Placeholder data — replace with oRPC query when event catalog router exists
const SAMPLE_EVENTS = [
	{
		id: "1",
		eventName: "content.page.view",
		category: "content",
		displayName: "Page View",
		description: "Triggered when a content page is viewed",
		pricePerEvent: "0.000020",
		freeTierLimit: 50000,
		isBillable: true,
		isActive: true,
	},
	{
		id: "2",
		eventName: "content.cta.click",
		category: "content",
		displayName: "CTA Click",
		description: "Triggered when a call-to-action is clicked",
		pricePerEvent: "0.000050",
		freeTierLimit: 10000,
		isBillable: true,
		isActive: true,
	},
	{
		id: "3",
		eventName: "ai.completion",
		category: "ai",
		displayName: "AI Completion",
		description: "Triggered on each AI text generation",
		pricePerEvent: "0.001000",
		freeTierLimit: 100,
		isBillable: true,
		isActive: true,
	},
	{
		id: "4",
		eventName: "form.submission",
		category: "platform",
		displayName: "Form Submission",
		description: "Triggered when a form is submitted",
		pricePerEvent: "0.000100",
		freeTierLimit: 1000,
		isBillable: true,
		isActive: true,
	},
];

function DataManagementPage() {
	return (
		<main className="flex flex-col gap-4">
			<div className="flex flex-col gap-2">
				<h1 className="text-3xl md:text-4xl font-bold tracking-tight font-serif leading-tight">
					Gerenciamento de Dados
				</h1>
				<p className="text-base md:text-lg text-muted-foreground font-sans leading-relaxed">
					Gerencie eventos, propriedades e segmentos
				</p>
			</div>

			<Tabs defaultValue="events">
				<TabsList>
					<TabsTrigger value="events">Eventos</TabsTrigger>
					<TabsTrigger value="properties">Propriedades</TabsTrigger>
					<TabsTrigger value="segments">Segmentos</TabsTrigger>
				</TabsList>

				<TabsContent value="events" className="mt-4">
					<EventCatalogTable events={SAMPLE_EVENTS} />
				</TabsContent>

				<TabsContent value="properties" className="mt-4">
					<div className="flex flex-col items-center justify-center py-16 text-center">
						<p className="text-muted-foreground">
							Gerenciamento de propriedades em breve...
						</p>
					</div>
				</TabsContent>

				<TabsContent value="segments" className="mt-4">
					<div className="flex flex-col items-center justify-center py-16 text-center">
						<p className="text-muted-foreground">
							Gerenciamento de segmentos em breve...
						</p>
					</div>
				</TabsContent>
			</Tabs>
		</main>
	);
}
