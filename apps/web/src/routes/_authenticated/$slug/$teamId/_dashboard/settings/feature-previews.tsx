import { Badge } from "@packages/ui/components/badge";
import {
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemGroup,
	ItemMedia,
	ItemTitle,
} from "@packages/ui/components/item";
import { Switch } from "@packages/ui/components/switch";
import { createFileRoute } from "@tanstack/react-router";
import { FlaskConical, LayoutGrid } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute(
	"/_authenticated/$slug/$teamId/_dashboard/settings/feature-previews",
)({
	component: FeaturePreviewsPage,
});

const featurePreviews = [
	{
		id: "forms",
		name: "Formulários",
		description:
			"Crie formulários de captura de leads e incorpore-os no conteúdo do blog.",
		icon: LayoutGrid,
		status: "Beta" as const,
	},
];

function FeaturePreviewsPage() {
	const [enabledFeatures, setEnabledFeatures] = useState<Set<string>>(
		new Set(),
	)

	const toggleFeature = (id: string) => {
		setEnabledFeatures((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		})
	}

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-semibold font-serif">
					Prévias de Funcionalidades
				</h1>
				<p className="text-sm text-muted-foreground mt-1">
					Experimente funcionalidades em fase beta antes do lançamento
					oficial.
				</p>
			</div>
			<ItemGroup>
				{featurePreviews.map((feature) => (
					<Item key={feature.id} variant="muted">
						<ItemMedia variant="icon">
							<feature.icon className="size-4" />
						</ItemMedia>
						<ItemContent>
							<div className="flex items-center gap-2">
								<ItemTitle>{feature.name}</ItemTitle>
								<Badge
									variant="secondary"
									className="text-xs"
								>
									<FlaskConical className="size-3 mr-1" />
									{feature.status}
								</Badge>
							</div>
							<ItemDescription>
								{feature.description}
							</ItemDescription>
						</ItemContent>
						<ItemActions>
							<Switch
								checked={enabledFeatures.has(
									feature.id,
								)}
								onCheckedChange={() =>
									toggleFeature(feature.id)
								}
							/>
						</ItemActions>
					</Item>
				))}
			</ItemGroup>
		</div>
	)
}
