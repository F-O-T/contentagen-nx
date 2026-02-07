import { cn } from "@packages/ui/lib/utils";

interface FunnelStep {
	name: string;
	count: number;
}

interface FunnelChartProps {
	steps: FunnelStep[];
	height?: number;
}

export function FunnelChart({ steps }: FunnelChartProps) {
	if (steps.length === 0) return null;
	const maxCount = steps[0].count;

	return (
		<div className="space-y-3">
			{steps.map((step, index) => {
				const percentage =
					maxCount > 0 ? (step.count / maxCount) * 100 : 0;
				const dropOff =
					index > 0
						? (
								((steps[index - 1].count - step.count) /
									steps[index - 1].count) *
								100
							).toFixed(1)
						: null;

				return (
					<div key={`funnel-step-${index + 1}`} className="space-y-1">
						<div className="flex items-center justify-between text-sm">
							<div className="flex items-center gap-2">
								<span className="text-muted-foreground font-mono text-xs w-5">
									{index + 1}
								</span>
								<span className="font-medium">{step.name}</span>
							</div>
							<div className="flex items-center gap-3">
								<span className="tabular-nums font-medium">
									{step.count.toLocaleString("pt-BR")}
								</span>
								<span className="tabular-nums text-muted-foreground text-xs w-12 text-right">
									{percentage.toFixed(1)}%
								</span>
							</div>
						</div>
						<div className="h-8 bg-muted rounded overflow-hidden">
							<div
								className={cn(
									"h-full rounded transition-all duration-500",
									index === 0
										? "bg-primary"
										: "bg-primary/70",
								)}
								style={{ width: `${percentage}%` }}
							/>
						</div>
						{dropOff !== null && (
							<p className="text-xs text-muted-foreground pl-7">
								{dropOff}% drop-off
							</p>
						)}
					</div>
				);
			})}
		</div>
	);
}
