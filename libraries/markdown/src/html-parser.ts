/**
 * HTML to Markdown Parser
 *
 * Converts HTML content to Markdown format using a lightweight state machine parser.
 * Supports all common HTML elements including headings, paragraphs, lists, tables,
 * code blocks, links, images, and inline formatting.
 */

import { generate } from "./generator";
import type {
   BlockNode,
   BlockquoteNode,
   CodeBlockNode,
   CodeSpanNode,
   DocumentNode,
   EmphasisNode,
   HardBreakNode,
   HeadingNode,
   ImageNode,
   InlineNode,
   LinkNode,
   ListItemNode,
   ListNode,
   ParagraphNode,
   StrongNode,
   TableCellNode,
   TableNode,
   TableRowNode,
   ThematicBreakNode,
} from "./schemas";

// =============================================================================
// Types
// =============================================================================

/**
 * Options for HTML to Markdown conversion
 */
export interface HtmlToMarkdownOptions {
   /** Keep original whitespace (default: false) */
   preserveWhitespace?: boolean;
   /** Heading style: "atx" (#) or "setext" (===) (default: "atx") */
   headingStyle?: "atx" | "setext";
   /** Unordered list marker (default: "-") */
   bulletMarker?: "-" | "*" | "+";
   /** Code block style (default: "fenced") */
   codeBlockStyle?: "fenced" | "indented";
   /** Fence character (default: "`") */
   fence?: "`" | "~";
   /** Strong marker (default: "**") */
   strongMarker?: "**" | "__";
   /** Emphasis marker (default: "*") */
   emphasisMarker?: "*" | "_";
   /** Link style (default: "inline") */
   linkStyle?: "inline" | "reference";
}

/** Intermediate HTML node representation */
interface HtmlNode {
   type: "element" | "text" | "comment";
   tag?: string;
   attributes?: Record<string, string>;
   children?: HtmlNode[];
   content?: string;
}

// =============================================================================
// HTML Parser (State Machine)
// =============================================================================

const SELF_CLOSING_TAGS = new Set([
   "area",
   "base",
   "br",
   "col",
   "embed",
   "hr",
   "img",
   "input",
   "link",
   "meta",
   "param",
   "source",
   "track",
   "wbr",
]);

const BLOCK_TAGS = new Set([
   "address",
   "article",
   "aside",
   "blockquote",
   "dd",
   "details",
   "dialog",
   "div",
   "dl",
   "dt",
   "fieldset",
   "figcaption",
   "figure",
   "footer",
   "form",
   "h1",
   "h2",
   "h3",
   "h4",
   "h5",
   "h6",
   "header",
   "hgroup",
   "hr",
   "li",
   "main",
   "nav",
   "ol",
   "p",
   "pre",
   "section",
   "table",
   "tbody",
   "td",
   "tfoot",
   "th",
   "thead",
   "tr",
   "ul",
]);

/**
 * Parse HTML string into an intermediate AST
 */
export function parseHtml(html: string): HtmlNode[] {
   let pos = 0;

   function parseNodes(): HtmlNode[] {
      const result: HtmlNode[] = [];

      while (pos < html.length) {
         // Check for closing tag
         if (html.startsWith("</", pos)) {
            break;
         }

         // Check for comment
         if (html.startsWith("<!--", pos)) {
            const endPos = html.indexOf("-->", pos + 4);
            if (endPos !== -1) {
               pos = endPos + 3;
               continue;
            }
         }

         // Check for opening tag
         if (html[pos] === "<") {
            const element = parseElement();
            if (element) {
               result.push(element);
               continue;
            }
         }

         // Parse text content
         const text = parseText();
         if (text) {
            result.push(text);
         }
      }

      return result;
   }

   function parseElement(): HtmlNode | null {
      if (html[pos] !== "<") return null;

      const tagStart = pos + 1;
      let tagEnd = tagStart;

      // Find end of tag name
      while (tagEnd < html.length && !/[\s/>]/.test(html[tagEnd]!)) {
         tagEnd++;
      }

      const tag = html.slice(tagStart, tagEnd).toLowerCase();
      if (!tag || tag.startsWith("!")) return null;

      // Parse attributes
      const attributes: Record<string, string> = {};
      let attrPos = tagEnd;

      while (attrPos < html.length) {
         // Skip whitespace
         while (attrPos < html.length && /\s/.test(html[attrPos]!)) {
            attrPos++;
         }

         // Check for end of tag
         if (html[attrPos] === ">" || html.startsWith("/>", attrPos)) {
            break;
         }

         // Parse attribute name
         let attrNameEnd = attrPos;
         while (
            attrNameEnd < html.length &&
            !/[\s=/>]/.test(html[attrNameEnd]!)
         ) {
            attrNameEnd++;
         }

         const attrName = html.slice(attrPos, attrNameEnd).toLowerCase();
         attrPos = attrNameEnd;

         // Skip whitespace
         while (attrPos < html.length && /\s/.test(html[attrPos]!)) {
            attrPos++;
         }

         // Check for value
         if (html[attrPos] === "=") {
            attrPos++; // Skip =

            // Skip whitespace
            while (attrPos < html.length && /\s/.test(html[attrPos]!)) {
               attrPos++;
            }

            let value: string;
            const quote = html[attrPos];

            if (quote === '"' || quote === "'") {
               attrPos++; // Skip opening quote
               const valueEnd = html.indexOf(quote, attrPos);
               if (valueEnd !== -1) {
                  value = html.slice(attrPos, valueEnd);
                  attrPos = valueEnd + 1;
               } else {
                  value = "";
               }
            } else {
               // Unquoted value
               let valueEnd = attrPos;
               while (
                  valueEnd < html.length &&
                  !/[\s>]/.test(html[valueEnd]!)
               ) {
                  valueEnd++;
               }
               value = html.slice(attrPos, valueEnd);
               attrPos = valueEnd;
            }

            attributes[attrName] = decodeHtmlEntities(value);
         } else if (attrName) {
            attributes[attrName] = "";
         }
      }

      // Find end of opening tag
      const selfClosing =
         html.startsWith("/>", attrPos) || SELF_CLOSING_TAGS.has(tag);
      if (html.startsWith("/>", attrPos)) {
         pos = attrPos + 2;
      } else {
         const closePos = html.indexOf(">", attrPos);
         if (closePos === -1) return null;
         pos = closePos + 1;
      }

      // Self-closing tags have no children
      if (selfClosing) {
         return { type: "element", tag, attributes };
      }

      // Parse children
      const children = parseNodes();

      // Find and skip closing tag
      const closingTag = `</${tag}>`;
      const closingPos = html
         .toLowerCase()
         .indexOf(closingTag.toLowerCase(), pos);
      if (closingPos !== -1) {
         pos = closingPos + closingTag.length;
      }

      return { type: "element", tag, attributes, children };
   }

   function parseText(): HtmlNode | null {
      const start = pos;
      while (pos < html.length && html[pos] !== "<") {
         pos++;
      }

      const content = html.slice(start, pos);
      if (!content) return null;

      return { type: "text", content: decodeHtmlEntities(content) };
   }

   return parseNodes();
}

/**
 * Decode HTML entities to their character equivalents
 */
function decodeHtmlEntities(text: string): string {
   const entities: Record<string, string> = {
      "&amp;": "&",
      "&lt;": "<",
      "&gt;": ">",
      "&quot;": '"',
      "&apos;": "'",
      "&nbsp;": " ",
      "&ndash;": "–",
      "&mdash;": "—",
      "&lsquo;": "\u2018",
      "&rsquo;": "\u2019",
      "&ldquo;": "\u201C",
      "&rdquo;": "\u201D",
      "&copy;": "\u00A9",
      "&reg;": "\u00AE",
      "&trade;": "\u2122",
      "&hellip;": "\u2026",
   };

   // Replace named entities
   let result = text;
   for (const [entity, char] of Object.entries(entities)) {
      result = result.split(entity).join(char);
   }

   // Replace numeric entities (decimal)
   result = result.replace(/&#(\d+);/g, (_, code) =>
      String.fromCharCode(Number.parseInt(code, 10)),
   );

   // Replace numeric entities (hex)
   result = result.replace(/&#x([0-9a-fA-F]+);/g, (_, code) =>
      String.fromCharCode(Number.parseInt(code, 16)),
   );

   return result;
}

// =============================================================================
// HTML to Markdown AST Conversion
// =============================================================================

/**
 * Convert HTML AST to Markdown AST
 */
export function htmlAstToMarkdownAst(
   nodes: HtmlNode[],
   options: HtmlToMarkdownOptions = {},
): DocumentNode {
   const blocks = convertNodesToBlocks(nodes, options);

   return {
      type: "document",
      children: blocks,
   };
}

function convertNodesToBlocks(
   nodes: HtmlNode[],
   options: HtmlToMarkdownOptions,
): BlockNode[] {
   const blocks: BlockNode[] = [];

   for (const node of nodes) {
      const converted = convertNodeToBlocks(node, options);
      blocks.push(...converted);
   }

   // Merge adjacent text-only blocks into paragraphs if needed
   return blocks;
}

function convertNodeToBlocks(
   node: HtmlNode,
   options: HtmlToMarkdownOptions,
): BlockNode[] {
   if (node.type === "text") {
      const trimmed = options.preserveWhitespace
         ? node.content || ""
         : (node.content || "").trim();

      if (!trimmed) return [];

      // Wrap text in paragraph
      const paragraph: ParagraphNode = {
         type: "paragraph",
         children: [{ type: "text", value: trimmed }],
      };
      return [paragraph];
   }

   if (node.type === "comment") {
      return [];
   }

   const tag = node.tag || "";
   const children = node.children || [];
   const attributes = node.attributes || {};

   // Headings
   if (/^h([1-6])$/.test(tag)) {
      const level = Number.parseInt(tag[1]!, 10) as 1 | 2 | 3 | 4 | 5 | 6;
      const heading: HeadingNode = {
         type: "heading",
         level,
         style: options.headingStyle || "atx",
         children: convertNodesToInline(children, options),
      };
      return [heading];
   }

   // Paragraph
   if (tag === "p") {
      const inlineChildren = convertNodesToInline(children, options);
      if (inlineChildren.length === 0) return [];

      const paragraph: ParagraphNode = {
         type: "paragraph",
         children: inlineChildren,
      };
      return [paragraph];
   }

   // Horizontal rule
   if (tag === "hr") {
      const hr: ThematicBreakNode = {
         type: "thematicBreak",
         marker: "-",
      };
      return [hr];
   }

   // Blockquote
   if (tag === "blockquote") {
      const blockquote: BlockquoteNode = {
         type: "blockquote",
         children: convertNodesToBlocks(children, options),
      };
      return [blockquote];
   }

   // Unordered list
   if (tag === "ul") {
      const list: ListNode = {
         type: "list",
         ordered: false,
         spread: false,
         marker: options.bulletMarker || "-",
         children: convertListItems(children, options),
      };
      return [list];
   }

   // Ordered list
   if (tag === "ol") {
      const start = attributes.start
         ? Number.parseInt(attributes.start, 10)
         : 1;
      const list: ListNode = {
         type: "list",
         ordered: true,
         start,
         spread: false,
         marker: ".",
         children: convertListItems(children, options),
      };
      return [list];
   }

   // Code block (pre > code)
   if (tag === "pre") {
      const codeChild = children.find(
         (c) => c.type === "element" && c.tag === "code",
      );
      const content = codeChild
         ? extractTextContent(codeChild.children || [])
         : extractTextContent(children);

      // Try to extract language from class
      const codeAttrs = codeChild?.attributes || {};
      const className = codeAttrs.class || "";
      const langMatch = className.match(/language-(\w+)/);
      const lang = langMatch ? langMatch[1] : undefined;

      const codeBlock: CodeBlockNode = {
         type: "codeBlock",
         style: options.codeBlockStyle || "fenced",
         fence: options.fence || "`",
         fenceLength: 3,
         lang,
         value: content.trim(),
      };
      return [codeBlock];
   }

   // Table
   if (tag === "table") {
      const table = convertTable(children, options);
      if (table) return [table];
      return [];
   }

   // Div, section, article - extract content
   if (
      [
         "div",
         "section",
         "article",
         "main",
         "aside",
         "nav",
         "header",
         "footer",
      ].includes(tag)
   ) {
      return convertNodesToBlocks(children, options);
   }

   // Figure with caption
   if (tag === "figure") {
      const blocks: BlockNode[] = [];
      for (const child of children) {
         if (child.type === "element") {
            if (child.tag === "img") {
               const imgBlocks = convertNodeToBlocks(child, options);
               blocks.push(...imgBlocks);
            } else if (child.tag === "figcaption") {
               // Could add caption as italic text
               const caption = extractTextContent(child.children || []).trim();
               if (caption) {
                  const paragraph: ParagraphNode = {
                     type: "paragraph",
                     children: [
                        {
                           type: "emphasis",
                           marker: "*",
                           children: [{ type: "text", value: caption }],
                        },
                     ],
                  };
                  blocks.push(paragraph);
               }
            }
         }
      }
      return blocks;
   }

   // Standalone img becomes a paragraph with image
   if (tag === "img") {
      const src = attributes.src || "";
      const alt = attributes.alt || "";
      const title = attributes.title;

      const image: ImageNode = {
         type: "image",
         url: src,
         alt,
         title,
      };

      const paragraph: ParagraphNode = {
         type: "paragraph",
         children: [image],
      };
      return [paragraph];
   }

   // Default: try to extract inline content as paragraph
   const inlineChildren = convertNodesToInline(children, options);
   if (inlineChildren.length > 0) {
      // Check if all children are text with only whitespace
      const hasContent = inlineChildren.some(
         (c) => c.type !== "text" || (c.type === "text" && c.value.trim()),
      );
      if (hasContent) {
         const paragraph: ParagraphNode = {
            type: "paragraph",
            children: inlineChildren,
         };
         return [paragraph];
      }
   }

   return [];
}

function convertListItems(
   nodes: HtmlNode[],
   options: HtmlToMarkdownOptions,
): ListItemNode[] {
   const items: ListItemNode[] = [];

   for (const node of nodes) {
      if (node.type === "element" && node.tag === "li") {
         const children = node.children || [];

         // Check if LI contains block elements or just inline
         const hasBlockChildren = children.some(
            (c) =>
               c.type === "element" &&
               c.tag &&
               BLOCK_TAGS.has(c.tag) &&
               c.tag !== "li",
         );

         let itemChildren: BlockNode[];
         if (hasBlockChildren) {
            itemChildren = convertNodesToBlocks(children, options);
         } else {
            const inlineContent = convertNodesToInline(children, options);
            if (inlineContent.length > 0) {
               itemChildren = [
                  {
                     type: "paragraph",
                     children: inlineContent,
                  },
               ];
            } else {
               itemChildren = [];
            }
         }

         // Check for task list item
         const checkbox = children.find(
            (c) =>
               c.type === "element" &&
               c.tag === "input" &&
               c.attributes?.type === "checkbox",
         );

         const item: ListItemNode = {
            type: "listItem",
            marker: "-",
            spread: false,
            children: itemChildren,
         };

         if (checkbox) {
            item.checked = checkbox.attributes?.checked !== undefined;
         }

         items.push(item);
      }
   }

   return items;
}

function convertNodesToInline(
   nodes: HtmlNode[],
   options: HtmlToMarkdownOptions,
): InlineNode[] {
   const result: InlineNode[] = [];

   for (const node of nodes) {
      const converted = convertNodeToInline(node, options);
      result.push(...converted);
   }

   return result;
}

function convertNodeToInline(
   node: HtmlNode,
   options: HtmlToMarkdownOptions,
): InlineNode[] {
   if (node.type === "text") {
      const content = options.preserveWhitespace
         ? node.content || ""
         : normalizeWhitespace(node.content || "");

      if (!content) return [];

      return [{ type: "text", value: content }];
   }

   if (node.type === "comment") {
      return [];
   }

   const tag = node.tag || "";
   const children = node.children || [];
   const attributes = node.attributes || {};

   // Strong / Bold
   if (tag === "strong" || tag === "b") {
      const strong: StrongNode = {
         type: "strong",
         marker: options.strongMarker || "**",
         children: convertNodesToInline(children, options),
      };
      return [strong];
   }

   // Emphasis / Italic
   if (tag === "em" || tag === "i") {
      const emphasis: EmphasisNode = {
         type: "emphasis",
         marker: options.emphasisMarker || "*",
         children: convertNodesToInline(children, options),
      };
      return [emphasis];
   }

   // Strikethrough
   if (tag === "s" || tag === "del" || tag === "strike") {
      // Wrap in ~~ markers via text
      const content = extractTextContent(children);
      return [{ type: "text", value: `~~${content}~~` }];
   }

   // Code (inline)
   if (tag === "code") {
      const content = extractTextContent(children);
      const codeSpan: CodeSpanNode = {
         type: "codeSpan",
         value: content,
      };
      return [codeSpan];
   }

   // Link
   if (tag === "a") {
      const href = attributes.href || "";
      const title = attributes.title;

      const link: LinkNode = {
         type: "link",
         url: href,
         title,
         children: convertNodesToInline(children, options),
      };
      return [link];
   }

   // Image (inline)
   if (tag === "img") {
      const src = attributes.src || "";
      const alt = attributes.alt || "";
      const title = attributes.title;

      const image: ImageNode = {
         type: "image",
         url: src,
         alt,
         title,
      };
      return [image];
   }

   // Line break
   if (tag === "br") {
      const hardBreak: HardBreakNode = {
         type: "hardBreak",
      };
      return [hardBreak];
   }

   // Subscript / Superscript - convert to text
   if (tag === "sub" || tag === "sup") {
      const content = extractTextContent(children);
      return [{ type: "text", value: content }];
   }

   // Span, small, etc - extract content
   if (
      ["span", "small", "mark", "u", "abbr", "cite", "q", "time"].includes(tag)
   ) {
      return convertNodesToInline(children, options);
   }

   // Default: extract text content
   const textContent = extractTextContent([node]);
   if (textContent.trim()) {
      return [{ type: "text", value: normalizeWhitespace(textContent) }];
   }

   return [];
}

function convertTable(
   nodes: HtmlNode[],
   options: HtmlToMarkdownOptions,
): TableNode | null {
   const rows: TableRowNode[] = [];
   let headerRow: TableRowNode | null = null;
   let alignments: Array<"left" | "center" | "right" | null> = [];

   // Find thead and tbody
   for (const node of nodes) {
      if (node.type !== "element") continue;

      if (node.tag === "thead") {
         const theadRows = extractTableRows(node.children || [], true, options);
         if (theadRows.length > 0) {
            headerRow = theadRows[0]!;
            alignments = extractAlignments(node.children || []);
         }
      } else if (node.tag === "tbody") {
         const tbodyRows = extractTableRows(
            node.children || [],
            false,
            options,
         );
         rows.push(...tbodyRows);
      } else if (node.tag === "tr") {
         // Direct tr children (no thead/tbody)
         if (!headerRow) {
            headerRow = convertTableRow(node, true, options);
            alignments = extractRowAlignments(node);
         } else {
            rows.push(convertTableRow(node, false, options));
         }
      }
   }

   if (!headerRow && rows.length === 0) return null;

   // If no explicit header, use first row as header
   if (!headerRow && rows.length > 0) {
      headerRow = rows.shift()!;
   }

   const allRows = headerRow ? [headerRow, ...rows] : rows;
   if (allRows.length === 0) return null;

   // Set alignments on all rows
   for (const row of allRows) {
      for (let i = 0; i < row.children.length; i++) {
         const cell = row.children[i];
         if (cell && alignments[i]) {
            cell.align = alignments[i] ?? undefined;
         }
      }
   }

   return {
      type: "table",
      align: alignments,
      children: allRows,
   };
}

function extractTableRows(
   nodes: HtmlNode[],
   isHeader: boolean,
   options: HtmlToMarkdownOptions,
): TableRowNode[] {
   const rows: TableRowNode[] = [];

   for (const node of nodes) {
      if (node.type === "element" && node.tag === "tr") {
         rows.push(convertTableRow(node, isHeader, options));
      }
   }

   return rows;
}

function convertTableRow(
   node: HtmlNode,
   isHeader: boolean,
   options: HtmlToMarkdownOptions,
): TableRowNode {
   const cells: TableCellNode[] = [];

   for (const child of node.children || []) {
      if (
         child.type === "element" &&
         (child.tag === "td" || child.tag === "th")
      ) {
         const cell: TableCellNode = {
            type: "tableCell",
            isHeader: child.tag === "th" || isHeader,
            children: convertNodesToInline(child.children || [], options),
         };

         // Extract alignment from style or align attribute
         const align = child.attributes?.align?.toLowerCase();
         const style = child.attributes?.style || "";
         const styleAlign = style.match(/text-align:\s*(left|center|right)/i);

         if (align === "left" || align === "center" || align === "right") {
            cell.align = align;
         } else if (styleAlign) {
            cell.align = styleAlign[1]!.toLowerCase() as
               | "left"
               | "center"
               | "right";
         }

         cells.push(cell);
      }
   }

   return {
      type: "tableRow",
      isHeader,
      children: cells,
   };
}

function extractAlignments(
   nodes: HtmlNode[],
): Array<"left" | "center" | "right" | null> {
   for (const node of nodes) {
      if (node.type === "element" && node.tag === "tr") {
         return extractRowAlignments(node);
      }
   }
   return [];
}

function extractRowAlignments(
   row: HtmlNode,
): Array<"left" | "center" | "right" | null> {
   const alignments: Array<"left" | "center" | "right" | null> = [];

   for (const child of row.children || []) {
      if (
         child.type === "element" &&
         (child.tag === "td" || child.tag === "th")
      ) {
         const align = child.attributes?.align?.toLowerCase();
         const style = child.attributes?.style || "";
         const styleAlign = style.match(/text-align:\s*(left|center|right)/i);

         if (align === "left" || align === "center" || align === "right") {
            alignments.push(align);
         } else if (styleAlign) {
            alignments.push(
               styleAlign[1]!.toLowerCase() as "left" | "center" | "right",
            );
         } else {
            alignments.push(null);
         }
      }
   }

   return alignments;
}

function extractTextContent(nodes: HtmlNode[]): string {
   let text = "";

   for (const node of nodes) {
      if (node.type === "text") {
         text += node.content || "";
      } else if (node.type === "element" && node.children) {
         text += extractTextContent(node.children);
      }
   }

   return text;
}

function normalizeWhitespace(text: string): string {
   return text.replace(/\s+/g, " ");
}

// =============================================================================
// Main Export Functions
// =============================================================================

/**
 * Convert HTML string to Markdown string
 *
 * @param html - The HTML content to convert
 * @param options - Conversion options
 * @returns Markdown string
 *
 * @example
 * ```typescript
 * const html = '<h1>Hello</h1><p>This is <strong>bold</strong> text.</p>';
 * const markdown = htmlToMarkdown(html);
 * // Result: "# Hello\n\nThis is **bold** text."
 * ```
 */
export function htmlToMarkdown(
   html: string,
   options: HtmlToMarkdownOptions = {},
): string {
   // Remove doctype, html, head, body wrapper tags
   const cleanHtml = html
      .replace(/<!DOCTYPE[^>]*>/gi, "")
      .replace(/<\/?html[^>]*>/gi, "")
      .replace(/<head[\s\S]*?<\/head>/gi, "")
      .replace(/<\/?body[^>]*>/gi, "")
      .trim();

   if (!cleanHtml) return "";

   // Parse HTML to intermediate AST
   const htmlAst = parseHtml(cleanHtml);

   // Convert to Markdown AST
   const markdownAst = htmlAstToMarkdownAst(htmlAst, options);

   // Generate Markdown string - only pass defined options to avoid overriding defaults
   const generateOptions: Record<string, unknown> = {};
   if (options.fence !== undefined) generateOptions.fence = options.fence;
   if (options.emphasisMarker !== undefined)
      generateOptions.emphasis = options.emphasisMarker;
   if (options.strongMarker !== undefined)
      generateOptions.strong = options.strongMarker;
   if (options.bulletMarker !== undefined)
      generateOptions.bullet = options.bulletMarker;
   if (options.headingStyle === "setext") generateOptions.setext = true;

   return generate(markdownAst, generateOptions);
}
