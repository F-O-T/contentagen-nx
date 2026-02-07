import { Button } from "@packages/ui/components/button";
import { Input } from "@packages/ui/components/input";
import { Label } from "@packages/ui/components/label";
import { Plus, X } from "lucide-react";
import type { FunnelsConfig } from "../hooks/use-insight-config";

interface FunnelsQueryBuilderProps {
	config: FunnelsConfig;
	onUpdate: (updates: Partial<FunnelsConfig>) => void;
}

export function FunnelsQueryBuilder({ config, onUpdate }: FunnelsQueryBuilderProps) {
	const addStep = () => {
		onUpdate({ steps: [...config.steps, { event: "", label: `Step ${config.steps.length + 1}` }] });
	};
	const removeStep = (index: number) => {
		if (config.steps.length <= 2) return;
		onUpdate({ steps: config.steps.filter((_, i) => i !== index) });
	};
	const updateStep = (index: number, updates: Partial<{ event: string; label: string }>) => {
		const steps = [...config.steps];
		steps[index] = { ...steps[index], ...updates };
		onUpdate({ steps });
	};

	return (
		<div className="space-y-6">
			<div className="space-y-3">
				<Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Steps</Label>
				{config.steps.map((step, index) => (
					<div key={`step-${index + 1}`} className="flex items-center gap-2">
						<span className="text-xs font-bold text-muted-foreground w-5">{index + 1}</span>
						<Input placeholder="Event name" value={step.event} onChange={(e) => updateStep(index, { event: e.target.value })} className="flex-1" />
						{config.steps.length > 2 && (
							<Button variant="ghost" size="icon" className="size-8" onClick={() => removeStep(index)}><X className="size-4" /></Button>
						)}
					</div>
				))}
				<Button variant="outline" size="sm" onClick={addStep} className="w-full"><Plus className="size-4 mr-1" />Add step</Button>
			</div>
			<div className="space-y-2">
				<Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Conversion window (days)</Label>
				<Input type="number" min={1} max={90} value={config.conversionWindow} onChange={(e) => onUpdate({ conversionWindow: Number.parseInt(e.target.value) || 14 })} />
			</div>
			<div className="space-y-2">
				<Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Breakdown</Label>
				<Input placeholder="Property (optional)" value={config.breakdown ?? ""} onChange={(e) => onUpdate({ breakdown: e.target.value || undefined })} />
			</div>
		</div>
	);
}
