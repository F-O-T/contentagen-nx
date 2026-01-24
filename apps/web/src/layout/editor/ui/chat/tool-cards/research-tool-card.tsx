/**
 * Research Tool Card
 *
 * Visualizes web search and SERP analysis results
 */

import { Search, Globe, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ToolCardBase, type ToolStatus } from "./tool-card-base";

// =============================================================================
// Types
// =============================================================================

export interface ResearchToolCardProps {
	/**
	 * Tool name (e.g., "webSearch", "webCrawl", "serpAnalysis")
	 */
	toolName: string;

	/**
	 * Tool arguments
	 */
	args: Record<string, unknown>;

	/**
	 * Tool result
	 */
	result?: unknown;

	/**
	 * Current status
	 */
	status: ToolStatus;
}

interface SearchResult {
	title?: string;
	url?: string;
	snippet?: string;
	score?: number;
}

// =============================================================================
// Tool Icon Mapping
// =============================================================================

const TOOL_ICONS: Record<string, LucideIcon> = {
	webSearch: Search,
	webCrawl: Globe,
	serpAnalysis: TrendingUp,
};

const TOOL_TITLES: Record<string, string> = {
	webSearch: "Pesquisa Web",
	webCrawl: "Rastrear Página",
	serpAnalysis: "Análise SERP",
};

// =============================================================================
// Main Component
// =============================================================================

export function ResearchToolCard({
	toolName,
	args,
	result,
	status,
}: ResearchToolCardProps) {
	const icon = TOOL_ICONS[toolName] || Search;
	const title = TOOL_TITLES[toolName] || toolName;

	// Extract search query from args
	const query = args.query ? String(args.query) : null;

	return (
		<ToolCardBase
			args={args}
			icon={icon}
			result={result}
			resultRenderer={(result) => {
				if (!result) return null;

				// Handle search results array
				if (Array.isArray(result)) {
					return (
						<div className="space-y-2">
							{result.slice(0, 3).map((item: SearchResult, i: number) => (
								<div
									className="p-2 rounded bg-muted/50 space-y-1"
									// biome-ignore lint/suspicious/noArrayIndexKey: Static results with no reordering
									key={i}
								>
									{item.title && (
										<div className="text-xs font-medium line-clamp-1">
											{item.title}
										</div>
									)}
									{item.url && (
										<div className="text-[10px] text-blue-600 dark:text-blue-400 truncate">
											{item.url}
										</div>
									)}
									{item.snippet && (
										<div className="text-xs text-muted-foreground line-clamp-2">
											{item.snippet}
										</div>
									)}
								</div>
							))}
							{result.length > 3 && (
								<div className="text-xs text-muted-foreground text-center">
									+{result.length - 3} mais resultados
								</div>
							)}
						</div>
					);
				}

				// Handle SERP analysis object
				if (typeof result === "object" && result !== null) {
					const analysis = result as {
						topKeywords?: string[];
						avgPosition?: number;
						competitorCount?: number;
					};

					return (
						<div className="space-y-2 text-xs">
							{analysis.topKeywords && (
								<div>
									<div className="font-medium text-muted-foreground mb-1">
										Principais palavras-chave:
									</div>
									<div className="flex flex-wrap gap-1">
										{analysis.topKeywords.slice(0, 5).map((kw, i) => (
											<span
												className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px]"
												// biome-ignore lint/suspicious/noArrayIndexKey: Static analysis data
												key={i}
											>
												{kw}
											</span>
										))}
									</div>
								</div>
							)}
							{analysis.avgPosition && (
								<div>
									<span className="text-muted-foreground">Posição média: </span>
									<span className="font-medium">{analysis.avgPosition}</span>
								</div>
							)}
							{analysis.competitorCount && (
								<div>
									<span className="text-muted-foreground">Concorrentes: </span>
									<span className="font-medium">{analysis.competitorCount}</span>
								</div>
							)}
						</div>
					);
				}

				// Default JSON rendering
				return (
					<div className="p-2 rounded bg-muted text-xs font-mono overflow-x-auto">
						<pre>{JSON.stringify(result, null, 2)}</pre>
					</div>
				);
			}}
			status={status}
			title={title}
		>
			{query && (
				<div className="flex items-center gap-2">
					<span className="text-xs text-muted-foreground">Consulta:</span>
					<span className="text-xs font-medium">{query}</span>
				</div>
			)}
		</ToolCardBase>
	);
}
