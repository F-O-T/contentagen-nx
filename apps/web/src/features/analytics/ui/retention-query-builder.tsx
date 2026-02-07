import { Input } from "@packages/ui/components/input";
import { Label } from "@packages/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@packages/ui/components/select";
import type { RetentionConfig } from "../hooks/use-insight-config";

interface RetentionQueryBuilderProps {
	config: RetentionConfig;
	onUpdate: (updates: Partial<RetentionConfig>) => void;
}

const PERIODS = [
	{ value: "day", label: "Day" },
	{ value: "week", label: "Week" },
	{ value: "month", label: "Month" },
];

export function RetentionQueryBuilder({ config, onUpdate }: RetentionQueryBuilderProps) {
	return (
		<div className="space-y-6">
			<div className="space-y-2">
				<Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Cohort event</Label>
				<Input placeholder="Event that starts a cohort (e.g., content.page.view)" value={config.cohortEvent} onChange={(e) => onUpdate({ cohortEvent: e.target.value })} />
				<p className="text-xs text-muted-foreground">Users who perform this event start a new cohort</p>
			</div>
			<div className="space-y-2">
				<Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Return event</Label>
				<Input placeholder="Event that counts as return (e.g., content.page.view)" value={config.returnEvent} onChange={(e) => onUpdate({ returnEvent: e.target.value })} />
				<p className="text-xs text-muted-foreground">Users who perform this event are counted as retained</p>
			</div>
			<div className="space-y-2">
				<Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Period</Label>
				<Select value={config.period} onValueChange={(value) => onUpdate({ period: value as RetentionConfig["period"] })}>
					<SelectTrigger><SelectValue /></SelectTrigger>
					<SelectContent>
						{PERIODS.map((p) => (<SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>))}
					</SelectContent>
				</Select>
			</div>
		</div>
	);
}
