import { translate } from "@packages/localization";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@packages/ui/components/card";
import { BarChart3, Clock, FileText } from "lucide-react";

type ContentStatsCardProps = {
	stats?: {
		readTimeMinutes: string;
		wordsCount: string;
	} | null;
	body?: string;
};

export function ContentStatsCard({ stats, body }: ContentStatsCardProps) {
	// Calculate word count from body if stats not available
	const wordCount = stats?.wordsCount
		? Number.parseInt(stats.wordsCount, 10)
		: body?.split(/\s+/).filter(Boolean).length ?? 0;

	// Estimate read time (average 200 words per minute)
	const readTime = stats?.readTimeMinutes
		? Number.parseInt(stats.readTimeMinutes, 10)
		: Math.max(1, Math.ceil(wordCount / 200));

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<BarChart3 className="size-5" />
					{translate("dashboard.routes.content.details.stats-title")}
				</CardTitle>
				<CardDescription>
					{translate("dashboard.routes.content.details.stats-description")}
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="grid grid-cols-2 gap-4">
					<div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
						<FileText className="size-5 text-muted-foreground" />
						<div>
							<p className="text-2xl font-bold">{wordCount.toLocaleString()}</p>
							<p className="text-xs text-muted-foreground">
								{translate("dashboard.routes.content.details.words")}
							</p>
						</div>
					</div>

					<div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
						<Clock className="size-5 text-muted-foreground" />
						<div>
							<p className="text-2xl font-bold">{readTime}</p>
							<p className="text-xs text-muted-foreground">
								{translate("dashboard.routes.content.details.read-time")}
							</p>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
