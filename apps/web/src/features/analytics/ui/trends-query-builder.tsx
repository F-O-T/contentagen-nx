import { Button } from "@packages/ui/components/button";
import { Input } from "@packages/ui/components/input";
import { Label } from "@packages/ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@packages/ui/components/select";
import { Plus, X } from "lucide-react";
import type { TrendsConfig } from "../hooks/use-insight-config";

interface TrendsQueryBuilderProps {
	config: TrendsConfig;
	onUpdate: (updates: Partial<TrendsConfig>) => void;
}

const DATE_RANGES = [
	{ value: "last_7_days", label: "Last 7 days" },
	{ value: "last_30_days", label: "Last 30 days" },
	{ value: "last_90_days", label: "Last 90 days" },
	{ value: "this_month", label: "This month" },
	{ value: "last_month", label: "Last month" },
];

const CHART_TYPES = [
	{ value: "line", label: "Line" },
	{ value: "bar", label: "Bar" },
	{ value: "area", label: "Area" },
	{ value: "number", label: "Number" },
];

export function TrendsQueryBuilder({ config, onUpdate }: TrendsQueryBuilderProps) {
	const addEvent = () => {
		onUpdate({
			events: [
				...config.events,
				{ name: "", label: `Series ${String.fromCharCode(65 + config.events.length)}` },
			],
		});
	};

	const removeEvent = (index: number) => {
		onUpdate({
			events: config.events.filter((_, i) => i !== index),
		});
	};

	const updateEvent = (index: number, updates: Partial<{ name: string; label: string }>) => {
		const events = [...config.events];
		events[index] = { ...events[index], ...updates };
		onUpdate({ events });
	};

	return (
		<div className="space-y-6">
			<div className="space-y-3">
				<Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Series</Label>
				{config.events.map((event, index) => (
					<div key={`series-${index + 1}`} className="flex items-center gap-2">
						<span className="text-xs font-bold text-muted-foreground w-5">{String.fromCharCode(65 + index)}</span>
						<Input
							placeholder="Event name (e.g., content.page.view)"
							value={event.name}
							onChange={(e) => updateEvent(index, { name: e.target.value })}
							className="flex-1"
						/>
						{config.events.length > 1 && (
							<Button variant="ghost" size="icon" className="size-8" onClick={() => removeEvent(index)}>
								<X className="size-4" />
							</Button>
						)}
					</div>
				))}
				<Button variant="outline" size="sm" onClick={addEvent} className="w-full">
					<Plus className="size-4 mr-1" />
					Add series
				</Button>
			</div>

			<div className="space-y-2">
				<Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Chart type</Label>
				<Select value={config.chartType} onValueChange={(value) => onUpdate({ chartType: value as TrendsConfig["chartType"] })}>
					<SelectTrigger><SelectValue /></SelectTrigger>
					<SelectContent>
						{CHART_TYPES.map((ct) => (<SelectItem key={ct.value} value={ct.value}>{ct.label}</SelectItem>))}
					</SelectContent>
				</Select>
			</div>

			<div className="space-y-2">
				<Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Date range</Label>
				<Select value={config.dateRange} onValueChange={(value) => onUpdate({ dateRange: value })}>
					<SelectTrigger><SelectValue /></SelectTrigger>
					<SelectContent>
						{DATE_RANGES.map((dr) => (<SelectItem key={dr.value} value={dr.value}>{dr.label}</SelectItem>))}
					</SelectContent>
				</Select>
			</div>

			<div className="space-y-2">
				<Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Breakdown</Label>
				<Input
					placeholder="Property (e.g., traffic_source)"
					value={config.breakdown ?? ""}
					onChange={(e) => onUpdate({ breakdown: e.target.value || undefined })}
				/>
			</div>
		</div>
	);
}
