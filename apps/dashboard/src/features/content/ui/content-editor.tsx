"use client";

import { cn } from "@packages/ui/lib/utils";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { CheckListPlugin } from "@lexical/react/LexicalCheckListPlugin";
import { HorizontalRulePlugin } from "@lexical/react/LexicalHorizontalRulePlugin";
import { TablePlugin } from "@lexical/react/LexicalTablePlugin";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListNode, ListItemNode } from "@lexical/list";
import { LinkNode, AutoLinkNode } from "@lexical/link";
import { CodeNode, CodeHighlightNode } from "@lexical/code";
import { TableNode, TableCellNode, TableRowNode } from "@lexical/table";
import { $generateNodesFromDOM } from "@lexical/html";
import {
	$convertFromMarkdownString,
	$convertToMarkdownString,
	CHECK_LIST,
	ELEMENT_TRANSFORMERS,
	MULTILINE_ELEMENT_TRANSFORMERS,
	TEXT_FORMAT_TRANSFORMERS,
	TEXT_MATCH_TRANSFORMERS,
	type ElementTransformer,
} from "@lexical/markdown";
import {
	$createHorizontalRuleNode,
	$isHorizontalRuleNode,
	HorizontalRuleNode,
} from "@lexical/react/LexicalHorizontalRuleNode";
import { $getRoot, type EditorState, type LexicalEditor } from "lexical";
import { useCallback, useEffect, useRef } from "react";
import { FIMPlugin } from "../plugins/fim-plugin";
import { EditPlugin } from "../plugins/edit-plugin";
import { ChatPlugin } from "../plugins/chat-plugin";
import { FloatingToolbarPlugin } from "../plugins/floating-toolbar-plugin";
import { MarkdownPastePlugin } from "../plugins/markdown-paste-plugin";
import { GhostTextNode } from "../nodes/ghost-text-node";
import { ImageNode, $createImageNode, $isImageNode } from "../nodes/image-node";
import { TooltipProvider } from "@packages/ui/components/tooltip";

type ContentEditorProps = {
	initialContent?: string;
	onChange?: (content: string) => void;
	onBlur?: () => void;
	placeholder?: string;
	disabled?: boolean;
	className?: string;
};

// Custom transformer for horizontal rule
const HR_TRANSFORMER: ElementTransformer = {
	dependencies: [HorizontalRuleNode],
	export: (node) => {
		return $isHorizontalRuleNode(node) ? "---" : null;
	},
	regExp: /^(---|___|\*\*\*)$/,
	replace: (parentNode) => {
		const node = $createHorizontalRuleNode();
		parentNode.replace(node);
	},
	type: "element",
};

// Custom transformer for images
const IMAGE_TRANSFORMER: ElementTransformer = {
	dependencies: [ImageNode],
	export: (node) => {
		if (!$isImageNode(node)) return null;
		const alt = node.getAlt() || "";
		const src = node.getSrc();
		return `![${alt}](${src})`;
	},
	regExp: /^!\[([^\]]*)\]\(([^)]+)\)$/,
	replace: (parentNode, _children, match) => {
		const [, alt, src] = match;
		const imageNode = $createImageNode(src || "", alt || "");
		parentNode.replace(imageNode);
	},
	type: "element",
};

export const EXTENDED_TRANSFORMERS = [
	HR_TRANSFORMER,
	IMAGE_TRANSFORMER,
	CHECK_LIST,
	...ELEMENT_TRANSFORMERS,
	...MULTILINE_ELEMENT_TRANSFORMERS,
	...TEXT_FORMAT_TRANSFORMERS,
	...TEXT_MATCH_TRANSFORMERS,
];

/**
 * Check if markdown contains elements that need HTML conversion (tables, images)
 */
function needsHtmlConversion(markdown: string): boolean {
	// Check for tables (lines with pipes)
	const hasTable = /\|.+\|/.test(markdown) && /\|[\s\-:|]+\|/.test(markdown);
	// Check for images
	const hasImage = /!\[.*?\]\(.+?\)/.test(markdown);
	return hasTable || hasImage;
}

/**
 * Convert markdown to HTML for complex elements (tables, images)
 * Uses simple regex conversion for reliable rendering
 */
function markdownToHtml(markdown: string): string {
	let html = markdown;

	// Process code blocks first (to avoid processing markdown inside them)
	html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
		const escapedCode = code
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;");
		return `<pre><code class="language-${lang || "plaintext"}">${escapedCode}</code></pre>`;
	});

	// Process inline code (before other inline formatting)
	html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

	// Process headers
	html = html.replace(/^###### (.+)$/gm, "<h6>$1</h6>");
	html = html.replace(/^##### (.+)$/gm, "<h5>$1</h5>");
	html = html.replace(/^#### (.+)$/gm, "<h4>$1</h4>");
	html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
	html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
	html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");

	// Process blockquotes
	html = html.replace(/^> (.+)$/gm, "<blockquote><p>$1</p></blockquote>");

	// Process horizontal rules
	html = html.replace(/^(---|\*\*\*|___)$/gm, "<hr>");

	// Process images (before links)
	html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');

	// Process bold
	html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
	html = html.replace(/__([^_]+)__/g, "<strong>$1</strong>");

	// Process italic
	html = html.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, "<em>$1</em>");
	html = html.replace(/(?<!_)_([^_\n]+)_(?!_)/g, "<em>$1</em>");

	// Process strikethrough
	html = html.replace(/~~(.+?)~~/g, "<del>$1</del>");

	// Process links
	html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

	// Process tables
	html = html.replace(
		/((?:^\|.+\|$\n?)+)/gm,
		(tableMatch) => {
			const lines = tableMatch.trim().split("\n").filter((line) => line.trim());
			if (lines.length < 2) return tableMatch;
			
			const headerLine = lines[0];
			const separatorLine = lines[1];
			if (!headerLine || !separatorLine) return tableMatch;
			if (!/^\|[\s\-:|]+\|$/.test(separatorLine)) return tableMatch;
			
			const parseRow = (row: string): string[] => {
				return row
					.replace(/^\||\|$/g, "")
					.split("|")
					.map((cell) => cell.trim());
			};
			
			const headerCells = parseRow(headerLine);
			const headerHtml = `<thead><tr>${headerCells.map((cell) => `<th>${cell}</th>`).join("")}</tr></thead>`;
			
			const bodyRows = lines.slice(2).map((row) => {
				const cells = parseRow(row);
				return `<tr>${cells.map((cell) => `<td>${cell}</td>`).join("")}</tr>`;
			}).join("");
			const bodyHtml = bodyRows ? `<tbody>${bodyRows}</tbody>` : "";
			
			return `<table>${headerHtml}${bodyHtml}</table>`;
		},
	);

	// Process task lists
	html = html.replace(
		/((?:^[-*+] \[[x ]\] .+$\n?)+)/gm,
		(match) => {
			const items = match
				.split("\n")
				.filter((line) => line.trim())
				.map((line) => {
					const checked = /\[x\]/i.test(line);
					const content = line.replace(/^[-*+] \[[x ]\] /i, "");
					return `<li><input type="checkbox" ${checked ? "checked" : ""} disabled>${content}</li>`;
				})
				.join("");
			return `<ul>${items}</ul>`;
		},
	);

	// Process unordered lists
	html = html.replace(
		/((?:^[-*+] .+$\n?)+)/gm,
		(match) => {
			const items = match
				.split("\n")
				.filter((line) => line.trim())
				.map((line) => `<li>${line.replace(/^[-*+] /, "")}</li>`)
				.join("");
			return `<ul>${items}</ul>`;
		},
	);

	// Process ordered lists
	html = html.replace(
		/((?:^\d+\. .+$\n?)+)/gm,
		(match) => {
			const items = match
				.split("\n")
				.filter((line) => line.trim())
				.map((line) => `<li>${line.replace(/^\d+\. /, "")}</li>`)
				.join("");
			return `<ol>${items}</ol>`;
		},
	);

	// Wrap remaining plain text lines in paragraphs
	const lines = html.split("\n");
	html = lines
		.map((line) => {
			const trimmed = line.trim();
			if (!trimmed) return "";
			if (
				trimmed.startsWith("<h") ||
				trimmed.startsWith("<p") ||
				trimmed.startsWith("<ul") ||
				trimmed.startsWith("<ol") ||
				trimmed.startsWith("<li") ||
				trimmed.startsWith("<blockquote") ||
				trimmed.startsWith("<pre") ||
				trimmed.startsWith("<hr") ||
				trimmed.startsWith("<table") ||
				trimmed.startsWith("<thead") ||
				trimmed.startsWith("<tbody") ||
				trimmed.startsWith("<tr") ||
				trimmed.startsWith("<th") ||
				trimmed.startsWith("<td") ||
				trimmed.startsWith("<img")
			) {
				return line;
			}
			return `<p>${line}</p>`;
		})
		.join("\n");

	return html;
}

const theme = {
	// Use EditorTheme classes that work with prose
	paragraph: "editor-paragraph",
	heading: {
		h1: "editor-heading-h1",
		h2: "editor-heading-h2",
		h3: "editor-heading-h3",
		h4: "editor-heading-h4",
		h5: "editor-heading-h5",
	},
	text: {
		bold: "font-bold",
		italic: "italic",
		underline: "underline",
		strikethrough: "line-through",
		code: "editor-text-code",
	},
	list: {
		ol: "editor-list-ol",
		ul: "editor-list-ul",
		listitem: "editor-listitem",
		checklist: "editor-checklist",
		listitemChecked: "editor-listitem-checked",
		listitemUnchecked: "editor-listitem-unchecked",
	},
	quote: "editor-quote",
	code: "editor-code",
	codeHighlight: {
		atrule: "text-purple-500",
		attr: "text-yellow-500",
		boolean: "text-blue-500",
		builtin: "text-cyan-500",
		cdata: "text-gray-500",
		char: "text-green-500",
		class: "text-yellow-500",
		"class-name": "text-yellow-500",
		comment: "text-gray-500 italic",
		constant: "text-purple-500",
		deleted: "text-red-500",
		doctype: "text-gray-500",
		entity: "text-red-500",
		function: "text-blue-500",
		important: "text-red-500 font-bold",
		inserted: "text-green-500",
		keyword: "text-purple-500",
		namespace: "text-purple-500",
		number: "text-orange-500",
		operator: "text-gray-700 dark:text-gray-300",
		prolog: "text-gray-500",
		property: "text-cyan-500",
		punctuation: "text-gray-600 dark:text-gray-400",
		regex: "text-red-500",
		selector: "text-green-500",
		string: "text-green-500",
		symbol: "text-purple-500",
		tag: "text-red-500",
		url: "text-blue-500 underline",
		variable: "text-orange-500",
	},
	link: "editor-link",
	horizontalRule: "editor-hr",
	table: "editor-table",
	tableCell: "editor-table-cell",
	tableCellHeader: "editor-table-cell-header",
	tableRow: "editor-table-row",
};

function onError(error: Error) {
	console.error("Lexical error:", error);
}

export function ContentEditor({
	initialContent,
	onChange,
	onBlur,
	placeholder = "Start writing...",
	disabled = false,
	className,
}: ContentEditorProps) {
	const editorRef = useRef<LexicalEditor | null>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	const initialConfig = {
		namespace: "ContentEditor",
		theme,
		onError,
		nodes: [
			HeadingNode,
			QuoteNode,
			ListNode,
			ListItemNode,
			LinkNode,
			AutoLinkNode,
			CodeNode,
			CodeHighlightNode,
			HorizontalRuleNode,
			TableNode,
			TableCellNode,
			TableRowNode,
			GhostTextNode,
			ImageNode,
		],
		editable: !disabled,
		// Don't set editorState here - we'll initialize via plugin for complex content
	};

	const handleChange = useCallback(
		(editorState: EditorState) => {
			if (!onChange) return;

			editorState.read(() => {
				let markdown = $convertToMarkdownString(EXTENDED_TRANSFORMERS);
				// Clean up unnecessary escapes that Lexical adds
				// Only unescape pipes that are not part of tables
				markdown = markdown.replace(/\\([|])/g, (match, char, offset) => {
					// Check if this pipe is likely part of a table (at line start/end)
					const beforeNewline = markdown.lastIndexOf('\n', offset);
					const afterNewline = markdown.indexOf('\n', offset);
					const line = markdown.slice(
						beforeNewline === -1 ? 0 : beforeNewline + 1,
						afterNewline === -1 ? markdown.length : afterNewline
					);
					// If line looks like a table row, keep the escape
					if (/^\|.*\|$/.test(line.trim())) {
						return match;
					}
					// Otherwise, unescape
					return char;
				});
				onChange(markdown);
			});
		},
		[onChange],
	);

	return (
		<LexicalComposer initialConfig={initialConfig}>
			<TooltipProvider>
				<div
					ref={containerRef}
					className={cn(
						"relative flex flex-col border rounded-md bg-background",
						disabled && "opacity-50 pointer-events-none",
						className,
					)}
				>
					{/* Editor-specific styles */}
					<style>{`
						.editor-paragraph {
							margin-bottom: 0.5rem;
						}
						.editor-heading-h1 {
							font-size: 1.875rem;
							line-height: 2.25rem;
							font-weight: 700;
							margin-bottom: 1rem;
							margin-top: 1.5rem;
						}
						.editor-heading-h2 {
							font-size: 1.5rem;
							line-height: 2rem;
							font-weight: 700;
							margin-bottom: 0.75rem;
							margin-top: 1.25rem;
						}
						.editor-heading-h3 {
							font-size: 1.25rem;
							line-height: 1.75rem;
							font-weight: 600;
							margin-bottom: 0.5rem;
							margin-top: 1rem;
						}
						.editor-heading-h4 {
							font-size: 1.125rem;
							line-height: 1.75rem;
							font-weight: 600;
							margin-bottom: 0.5rem;
						}
						.editor-heading-h5 {
							font-size: 1rem;
							line-height: 1.5rem;
							font-weight: 600;
							margin-bottom: 0.25rem;
						}
						.editor-text-code {
							background-color: var(--muted);
							padding: 0.125rem 0.25rem;
							border-radius: 0.25rem;
							font-family: var(--font-mono);
							font-size: 0.875rem;
						}
						.editor-list-ol {
							list-style-type: decimal;
							list-style-position: inside;
							margin-bottom: 0.5rem;
							padding-left: 0.5rem;
						}
						.editor-list-ul {
							list-style-type: disc;
							list-style-position: inside;
							margin-bottom: 0.5rem;
							padding-left: 0.5rem;
						}
						.editor-listitem {
							margin-left: 1rem;
						}
						.editor-checklist {
							list-style: none;
							padding-left: 0;
						}
						.editor-listitem-checked {
							position: relative;
							margin-left: 1.5rem;
							text-decoration: line-through;
							color: var(--muted-foreground);
						}
						.editor-listitem-checked::before {
							content: '✓';
							position: absolute;
							left: -1.5rem;
							color: #22c55e;
						}
						.editor-listitem-unchecked {
							position: relative;
							margin-left: 1.5rem;
						}
						.editor-listitem-unchecked::before {
							content: '☐';
							position: absolute;
							left: -1.5rem;
						}
						.editor-quote {
							border-left: 4px solid var(--border);
							padding-left: 1rem;
							font-style: italic;
							color: var(--muted-foreground);
							margin-bottom: 0.5rem;
						}
						.editor-code {
							display: block;
							background-color: var(--muted);
							padding: 1rem;
							border-radius: 0.375rem;
							font-family: var(--font-mono);
							font-size: 0.875rem;
							margin-bottom: 0.5rem;
							overflow-x: auto;
							white-space: pre;
						}
						.editor-link {
							color: var(--primary);
							text-decoration: underline;
							cursor: pointer;
						}
						.editor-hr {
							border-top: 1px solid var(--border);
							margin: 1rem 0;
						}
						.editor-table {
							border-collapse: collapse;
							border: 1px solid var(--border);
							width: 100%;
							margin: 0.5rem 0;
						}
						.editor-table-cell {
							border: 1px solid var(--border);
							padding: 0.5rem;
						}
						.editor-table-cell-header {
							background-color: var(--muted);
							font-weight: 700;
							border: 1px solid var(--border);
							padding: 0.5rem;
						}
						.editor-table-row {
						}
						.editor-image {
							display: block;
							margin: 1rem 0;
						}
						.editor-image-wrapper {
							display: block;
						}
						.editor-image-wrapper img {
							max-width: 100%;
							height: auto;
							border-radius: 0.5rem;
						}
						.editor-image-wrapper figcaption {
							font-size: 0.875rem;
							color: var(--muted-foreground);
							text-align: center;
							margin-top: 0.5rem;
						}
					`}</style>
					<RichTextPlugin
						contentEditable={
							<ContentEditable
								className="flex-1 p-4 outline-none max-w-none overflow-y-auto"
								onBlur={onBlur}
							/>
						}
						placeholder={
							<div className="absolute top-4 left-4 text-muted-foreground pointer-events-none">
								{placeholder}
							</div>
						}
						ErrorBoundary={LexicalErrorBoundary}
					/>
					<HistoryPlugin />
					<AutoFocusPlugin />
					<ListPlugin />
					<CheckListPlugin />
					<LinkPlugin />
					<HorizontalRulePlugin />
					<TablePlugin />
					<MarkdownShortcutPlugin transformers={EXTENDED_TRANSFORMERS} />
					<MarkdownPastePlugin />
					<OnChangePlugin onChange={handleChange} />
					<EditorRefPlugin editorRef={editorRef} />
					<InitializeContentPlugin content={initialContent} />
					<FloatingToolbarPlugin containerRef={containerRef} />
					<FIMPlugin containerRef={containerRef} />
					<EditPlugin containerRef={containerRef} />
					<ChatPlugin />
				</div>
			</TooltipProvider>
		</LexicalComposer>
	);
}

// Plugin to capture editor ref
function EditorRefPlugin({
	editorRef,
}: {
	editorRef: React.MutableRefObject<LexicalEditor | null>;
}) {
	const [editor] = useLexicalComposerContext();

	useEffect(() => {
		editorRef.current = editor;
	}, [editor, editorRef]);

	return null;
}

// Plugin to initialize content from markdown (handles tables, images, etc.)
function InitializeContentPlugin({ content }: { content: string | undefined }) {
	const [editor] = useLexicalComposerContext();
	const isInitialized = useRef(false);

	useEffect(() => {
		if (!content || isInitialized.current) return;
		isInitialized.current = true;

		editor.update(() => {
			// Clear existing content
			const root = $getRoot();
			root.clear();

			if (needsHtmlConversion(content)) {
				// Use HTML conversion for tables/images
				const html = markdownToHtml(content);
				const parser = new DOMParser();
				const dom = parser.parseFromString(`<body>${html}</body>`, "text/html");
				const nodes = $generateNodesFromDOM(editor, dom);
				root.append(...nodes);
			} else {
				// Use standard markdown conversion
				$convertFromMarkdownString(content, EXTENDED_TRANSFORMERS);
			}
		});
	}, [content, editor]);

	return null;
}
