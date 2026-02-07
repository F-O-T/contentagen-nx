import { cn } from "@packages/ui/lib/utils";

interface RetentionGridProps {
	data: Array<{ cohort: string; size: number; values: number[] }>;
	periods: string[];
}

function getRetentionColor(percentage: number): string {
	if (percentage >= 80) return "bg-green-600 text-white";
	if (percentage >= 60) return "bg-green-500 text-white";
	if (percentage >= 40) return "bg-green-400 text-white";
	if (percentage >= 20) return "bg-green-300 text-green-900";
	if (percentage > 0) return "bg-green-200 text-green-900";
	return "bg-muted text-muted-foreground";
}

export function RetentionGrid({ data, periods }: RetentionGridProps) {
	if (data.length === 0) return null;

	return (
		<div className="overflow-x-auto">
			<table className="w-full text-sm">
				<thead>
					<tr className="border-b">
						<th className="text-left py-2 px-3 font-medium text-muted-foreground">
							Cohort
						</th>
						<th className="text-right py-2 px-3 font-medium text-muted-foreground">
							Size
						</th>
						{periods.map((period) => (
							<th
								key={period}
								className="text-center py-2 px-3 font-medium text-muted-foreground"
							>
								{period}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{data.map((row) => (
						<tr
							key={row.cohort}
							className="border-b last:border-0"
						>
							<td className="py-2 px-3 font-medium">
								{row.cohort}
							</td>
							<td className="py-2 px-3 text-right tabular-nums">
								{row.size.toLocaleString("pt-BR")}
							</td>
							{row.values.map((value, i) => {
								const percentage =
									row.size > 0
										? (value / row.size) * 100
										: 0;
								return (
									<td
										key={`${row.cohort}-${periods[i]}`}
										className="py-1 px-1"
									>
										<div
											className={cn(
												"rounded px-2 py-1.5 text-center text-xs font-medium tabular-nums",
												getRetentionColor(percentage),
											)}
										>
											{percentage.toFixed(1)}%
										</div>
									</td>
								);
							})}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
