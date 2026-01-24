/**
 * Tool UI Registry
 *
 * Maps tool names to their custom UI components using assistant-ui's makeAssistantToolUI.
 * This allows tool calls to be rendered with rich, interactive visualizations.
 */

import { makeAssistantToolUI } from "@assistant-ui/react";
import {
	isEditorTool,
	isFrontmatterTool,
	isResearchTool,
	isSEOTool,
} from "@/features/content/lib/assistant-runtime-adapter";
import { EditorToolCard } from "../ui/chat/tool-cards/editor-tool-card";
import { FrontmatterToolCard } from "../ui/chat/tool-cards/frontmatter-tool-card";
import { ResearchToolCard } from "../ui/chat/tool-cards/research-tool-card";
import { SeoToolCard } from "../ui/chat/tool-cards/seo-tool-card";
import type { ToolStatus } from "../ui/chat/tool-cards/tool-card-base";

// =============================================================================
// Tool UI Definitions
// =============================================================================

/**
 * Generic tool UI that routes to appropriate card component
 */
export const ContenttaToolUI = makeAssistantToolUI({
	toolName: "*", // Wildcard to match all tools
	render: function ToolCallRender({ part, status }) {
		const toolName = part.toolName;
		const args = part.args as Record<string, unknown>;
		const result = "result" in part ? part.result : undefined;

		// Map assistant-ui status to our ToolStatus type
		const toolStatus: ToolStatus =
			status.type === "complete"
				? "complete"
				: status.type === "running"
					? "running"
					: "error";

		// Route to appropriate card based on tool category
		if (isEditorTool(toolName)) {
			return (
				<EditorToolCard
					args={args}
					result={result}
					status={toolStatus}
					toolName={toolName}
				/>
			);
		}

		if (isFrontmatterTool(toolName)) {
			return (
				<FrontmatterToolCard
					args={args}
					result={result}
					status={toolStatus}
					toolName={toolName}
				/>
			);
		}

		if (isResearchTool(toolName)) {
			return (
				<ResearchToolCard
					args={args}
					result={result}
					status={toolStatus}
					toolName={toolName}
				/>
			);
		}

		if (isSEOTool(toolName)) {
			return (
				<SeoToolCard
					args={args}
					result={result}
					status={toolStatus}
					toolName={toolName}
				/>
			);
		}

		// Fallback for unknown tools
		return (
			<div className="p-3 rounded-lg border bg-card text-card-foreground shadow-sm">
				<div className="font-medium text-sm mb-2">{toolName}</div>
				<div className="text-xs text-muted-foreground space-y-1">
					<div>
						<strong>Args:</strong>
						<pre className="mt-1 p-2 rounded bg-muted font-mono text-[10px] overflow-x-auto">
							{JSON.stringify(args, null, 2)}
						</pre>
					</div>
					{result && (
						<div>
							<strong>Result:</strong>
							<pre className="mt-1 p-2 rounded bg-muted font-mono text-[10px] overflow-x-auto">
								{JSON.stringify(result, null, 2)}
							</pre>
						</div>
					)}
				</div>
			</div>
		);
	},
});

// =============================================================================
// Export All Tool UIs
// =============================================================================

/**
 * Array of all tool UIs to register with assistant-ui
 */
export const TOOL_UIS = [ContenttaToolUI];
