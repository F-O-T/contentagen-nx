import {
	generateBlockquoteString,
	normalizeMarkdownEmphasis,
} from "@f-o-t/markdown";
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const insertElementTool = createTool({
	id: "insert-element",
	description:
		"Inserts a content element (text, heading, list, code block, or table) at a specific position in the editor. Use this to add new content to the blog post.",
	inputSchema: z.object({
		type: z
			.enum(["text", "heading", "list", "code", "table"])
			.describe(
				"The type of element to insert. 'text' for plain text/blockquote, 'heading' for section headings, 'list' for bullet or numbered lists, 'code' for code blocks, 'table' for markdown tables.",
			),
		content: z
			.string()
			.describe(
				"The markdown content to insert. For 'list', provide one item per line. For 'table', provide a markdown table string. For 'code', provide the code without backtick fences.",
			),
		position: z
			.enum(["cursor", "start", "end", "afterHeading", "beforeParagraph"])
			.describe(
				"Where to insert the element. 'cursor' = at current cursor, 'start' = beginning of document, 'end' = end of document, 'afterHeading' = after a specific heading (requires targetIndex), 'beforeParagraph' = before a specific paragraph (requires targetIndex).",
			),
		targetIndex: z
			.number()
			.optional()
			.describe(
				"Target index (0-based) for afterHeading or beforeParagraph positions.",
			),
		// heading-specific
		level: z
			.enum(["h2", "h3", "h4"])
			.optional()
			.default("h2")
			.describe(
				"Heading level to use when type is 'heading'. Defaults to h2.",
			),
		// list-specific
		ordered: z
			.boolean()
			.optional()
			.default(false)
			.describe(
				"When type is 'list', set to true to produce a numbered list. Defaults to false (bullet list).",
			),
		// text-specific
		isBlockquote: z
			.boolean()
			.optional()
			.default(false)
			.describe(
				"When type is 'text', set to true to wrap the content as a blockquote.",
			),
		// code-specific
		language: z
			.string()
			.optional()
			.describe(
				"Programming language for syntax highlighting when type is 'code' (e.g. 'typescript', 'python', 'bash').",
			),
	}),
	outputSchema: z.object({
		success: z.boolean(),
		markdown: z.string(),
		type: z.string(),
		position: z.string(),
	}),
	execute: async (inputData, context) => {
		const {
			type,
			content,
			position,
			level,
			ordered,
			isBlockquote,
			language,
		} = inputData;

		// Normalize markdown emphasis for all text to fix LLM escaping issues (e.g., \*\* → **)
		const normalizedContent = normalizeMarkdownEmphasis(content);

		let markdown: string;

		switch (type) {
			case "text": {
				markdown = isBlockquote
					? generateBlockquoteString(normalizedContent)
					: normalizedContent;
				break;
			}

			case "heading": {
				// Strip any existing leading # characters and whitespace
				const strippedText = normalizedContent.replace(/^#+\s*/, "").trim();
				const prefix =
					level === "h4" ? "#### " : level === "h3" ? "### " : "## ";
				markdown = `${prefix}${strippedText}`;
				break;
			}

			case "list": {
				const lines = normalizedContent
					.split("\n")
					.filter((line) => line.trim() !== "");
				if (ordered) {
					markdown = lines
						.map((line, i) => `${i + 1}. ${line.trim()}`)
						.join("\n");
				} else {
					markdown = lines.map((line) => `- ${line.trim()}`).join("\n");
				}
				break;
			}

			case "code": {
				const langTag = language ?? "";
				markdown = `\`\`\`${langTag}\n${normalizedContent}\n\`\`\``;
				break;
			}

			case "table": {
				// Pass markdown table content as-is; user provides valid markdown table
				markdown = normalizedContent;
				break;
			}
		}

		const result = {
			success: true,
			markdown,
			type,
			position,
		};

		const onBodyUpdate = context?.requestContext?.get("onBodyUpdate") as
			| ((toolName: string, output: Record<string, unknown>) => Promise<void>)
			| undefined;

		if (onBodyUpdate) {
			try {
				await onBodyUpdate("insert-element", result);
			} catch {
				// best-effort — don't fail the tool if the update callback throws
			}
		}

		return result;
	},
});
