/**
 * Editor Tool Card
 *
 * Visualizes editor operations like insertText, replaceText, etc.
 */

import {
	Type,
	Replace,
	Trash2,
	Bold,
	Heading,
	List,
	Image,
	Link,
	Table,
	Quote,
	Code,
	type LucideIcon,
} from "lucide-react";
import { ToolCardBase, type ToolStatus } from "./tool-card-base";

// =============================================================================
// Types
// =============================================================================

export interface EditorToolCardProps {
	/**
	 * Tool name (e.g., "insertText", "replaceText")
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

// =============================================================================
// Tool Icon Mapping
// =============================================================================

const TOOL_ICONS: Record<string, LucideIcon> = {
	insertText: Type,
	replaceText: Replace,
	deleteText: Trash2,
	formatText: Bold,
	insertHeading: Heading,
	insertList: List,
	insertImage: Image,
	insertLink: Link,
	insertTable: Table,
	insertQuote: Quote,
	insertCode: Code,
};

const TOOL_TITLES: Record<string, string> = {
	insertText: "Inserir Texto",
	replaceText: "Substituir Texto",
	deleteText: "Deletar Texto",
	formatText: "Formatar Texto",
	insertHeading: "Inserir Título",
	insertList: "Inserir Lista",
	insertImage: "Inserir Imagem",
	insertLink: "Inserir Link",
	insertTable: "Inserir Tabela",
	insertQuote: "Inserir Citação",
	insertCode: "Inserir Código",
};

// =============================================================================
// Main Component
// =============================================================================

export function EditorToolCard({
	toolName,
	args,
	result,
	status,
}: EditorToolCardProps) {
	const icon = TOOL_ICONS[toolName] || Type;
	const title = TOOL_TITLES[toolName] || toolName;

	// Extract preview from args
	const preview = extractPreview(toolName, args);

	return (
		<ToolCardBase
			args={args}
			icon={icon}
			result={result}
			status={status}
			title={title}
		>
			{preview && (
				<div className="p-2 rounded bg-muted/50 text-xs font-mono truncate">
					{preview}
				</div>
			)}
		</ToolCardBase>
	);
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Extract a preview from tool arguments
 */
function extractPreview(
	toolName: string,
	args: Record<string, unknown>,
): string | null {
	switch (toolName) {
		case "insertText":
		case "replaceText":
			return args.text ? String(args.text).slice(0, 100) : null;
		case "insertHeading":
			return args.text ? `# ${String(args.text)}` : null;
		case "insertLink":
			return args.url ? `[${args.text || "link"}](${args.url})` : null;
		case "insertImage":
			return args.url ? `![${args.alt || "image"}](${args.url})` : null;
		case "formatText":
			return args.format ? `Formato: ${args.format}` : null;
		default:
			return null;
	}
}
