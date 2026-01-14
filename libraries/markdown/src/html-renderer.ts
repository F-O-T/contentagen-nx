import type {
   BlockNode,
   BlockquoteNode,
   CodeBlockNode,
   CodeSpanNode,
   DocumentNode,
   EmphasisNode,
   HeadingNode,
   HtmlBlockNode,
   HtmlInlineNode,
   ImageNode,
   InlineNode,
   LinkNode,
   ListItemNode,
   ListNode,
   MarkdownDocument,
   Node,
   ParagraphNode,
   StrongNode,
   TableCellNode,
   TableNode,
   TableRowNode,
   TextNode,
   ThematicBreakNode,
} from "./schemas";
import { encodeHtmlEntities } from "./utils";

// =============================================================================
// Types
// =============================================================================

/**
 * Options for HTML rendering.
 */
export interface HtmlRenderOptions {
   /** Whether to sanitize raw HTML blocks/inline (default: true) */
   sanitizeHtml?: boolean;
   /** Whether to add target="_blank" to external links (default: false) */
   externalLinksNewTab?: boolean;
   /** Custom class prefix for elements (default: none) */
   classPrefix?: string;
   /** Whether to render soft breaks as <br> (default: false) */
   softBreakAsBr?: boolean;
   /** Custom URL transformer for links and images */
   transformUrl?: (url: string, type: "link" | "image") => string;
   /** Custom attributes to add to specific elements */
   elementAttributes?: {
      link?: Record<string, string>;
      image?: Record<string, string>;
      codeBlock?: Record<string, string>;
      heading?: Record<string, string>;
   };
}

// =============================================================================
// Default Options
// =============================================================================

const DEFAULT_OPTIONS: Required<HtmlRenderOptions> = {
   sanitizeHtml: true,
   externalLinksNewTab: false,
   classPrefix: "",
   softBreakAsBr: false,
   transformUrl: (url) => url,
   elementAttributes: {},
};

// =============================================================================
// Public API
// =============================================================================

/**
 * Renders a markdown document to HTML string.
 *
 * @param document - The markdown document or root node
 * @param options - Rendering options
 * @returns The generated HTML string
 *
 * @example
 * ```typescript
 * const doc = parse("# Hello **World**");
 * const html = renderToHtml(doc);
 * // => "<h1>Hello <strong>World</strong></h1>"
 * ```
 */
export function renderToHtml(
   document: MarkdownDocument | DocumentNode,
   options?: HtmlRenderOptions,
): string {
   const opts = { ...DEFAULT_OPTIONS, ...options };
   const root = "root" in document ? document.root : document;

   return renderDocument(root, opts);
}

/**
 * Renders any AST node to HTML string.
 *
 * @param node - The node to render
 * @param options - Rendering options
 * @returns The generated HTML string
 */
export function renderNodeToHtml(
   node: Node,
   options?: HtmlRenderOptions,
): string {
   const opts = { ...DEFAULT_OPTIONS, ...options };

   if (node.type === "document") {
      return renderDocument(node, opts);
   }

   if (isBlockNode(node)) {
      return renderBlock(node, opts);
   }

   return renderInline(node, opts);
}

// =============================================================================
// Type Guards
// =============================================================================

function isBlockNode(node: Node): node is BlockNode {
   return [
      "thematicBreak",
      "heading",
      "codeBlock",
      "htmlBlock",
      "paragraph",
      "linkReferenceDefinition",
      "blockquote",
      "list",
      "listItem",
      "table",
   ].includes(node.type);
}

// =============================================================================
// Document Rendering
// =============================================================================

function renderDocument(
   node: DocumentNode,
   opts: Required<HtmlRenderOptions>,
): string {
   return node.children.map((child) => renderBlock(child, opts)).join("\n");
}

// =============================================================================
// Block Rendering
// =============================================================================

function renderBlock(
   node: BlockNode,
   opts: Required<HtmlRenderOptions>,
): string {
   switch (node.type) {
      case "thematicBreak":
         return renderThematicBreak(node, opts);
      case "heading":
         return renderHeading(node, opts);
      case "codeBlock":
         return renderCodeBlock(node, opts);
      case "htmlBlock":
         return renderHtmlBlock(node, opts);
      case "paragraph":
         return renderParagraph(node, opts);
      case "blockquote":
         return renderBlockquote(node, opts);
      case "list":
         return renderList(node, opts);
      case "listItem":
         return renderListItem(node, opts);
      case "table":
         return renderTable(node, opts);
      case "linkReferenceDefinition":
         return ""; // Link references don't render to HTML
      default:
         return "";
   }
}

function renderThematicBreak(
   _node: ThematicBreakNode,
   opts: Required<HtmlRenderOptions>,
): string {
   const className = opts.classPrefix ? ` class="${opts.classPrefix}hr"` : "";
   return `<hr${className} />`;
}

function renderHeading(
   node: HeadingNode,
   opts: Required<HtmlRenderOptions>,
): string {
   const tag = `h${node.level}`;
   const content = node.children
      .map((child) => renderInline(child, opts))
      .join("");

   // Generate ID from heading text content
   const textContent = extractTextContent(node.children);
   const headingId = generateHeadingId(textContent);
   const idAttr = headingId ? ` id="${headingId}"` : "";

   const attrs = buildAttributes(
      opts.elementAttributes.heading,
      opts.classPrefix,
      tag,
   );
   return `<${tag}${idAttr}${attrs}>${content}</${tag}>`;
}

function renderCodeBlock(
   node: CodeBlockNode,
   opts: Required<HtmlRenderOptions>,
): string {
   const escapedCode = encodeHtmlEntities(node.value);
   const langClass = node.lang
      ? ` class="language-${encodeHtmlEntities(node.lang)}"`
      : "";
   const attrs = buildAttributes(
      opts.elementAttributes.codeBlock,
      opts.classPrefix,
      "pre",
   );
   return `<pre${attrs}><code${langClass}>${escapedCode}</code></pre>`;
}

function renderHtmlBlock(
   node: HtmlBlockNode,
   opts: Required<HtmlRenderOptions>,
): string {
   if (opts.sanitizeHtml) {
      // Escape raw HTML to prevent XSS
      return `<div class="raw-html">${encodeHtmlEntities(node.value)}</div>`;
   }
   return node.value;
}

function renderParagraph(
   node: ParagraphNode,
   opts: Required<HtmlRenderOptions>,
): string {
   const content = node.children
      .map((child) => renderInline(child, opts))
      .join("");
   const className = opts.classPrefix ? ` class="${opts.classPrefix}p"` : "";
   return `<p${className}>${content}</p>`;
}

function renderBlockquote(
   node: BlockquoteNode,
   opts: Required<HtmlRenderOptions>,
): string {
   const content = node.children
      .map((child) => renderBlock(child, opts))
      .join("\n");
   const className = opts.classPrefix
      ? ` class="${opts.classPrefix}blockquote"`
      : "";
   return `<blockquote${className}>\n${content}\n</blockquote>`;
}

function renderList(node: ListNode, opts: Required<HtmlRenderOptions>): string {
   const tag = node.ordered ? "ol" : "ul";
   const startAttr =
      node.ordered && node.start && node.start !== 1
         ? ` start="${node.start}"`
         : "";
   const className = opts.classPrefix
      ? ` class="${opts.classPrefix}${tag}"`
      : "";
   const items = node.children
      .map((item) => renderListItem(item, opts))
      .join("\n");
   return `<${tag}${startAttr}${className}>\n${items}\n</${tag}>`;
}

function renderListItem(
   node: ListItemNode,
   opts: Required<HtmlRenderOptions>,
): string {
   const className = opts.classPrefix ? ` class="${opts.classPrefix}li"` : "";

   // Handle task list items
   if (node.checked !== undefined) {
      const checkbox = `<input type="checkbox"${node.checked ? " checked" : ""} disabled />`;
      const content = node.children
         .map((child) => renderBlock(child, opts))
         .join("\n");
      // For task lists, unwrap paragraph content for cleaner output
      const unwrappedContent = content.replace(/^<p>|<\/p>$/g, "");
      return `<li${className}>${checkbox} ${unwrappedContent}</li>`;
   }

   // For tight lists (single paragraph), unwrap the paragraph
   if (node.children.length === 1 && node.children[0]?.type === "paragraph") {
      const paragraph = node.children[0] as ParagraphNode;
      const content = paragraph.children
         .map((child) => renderInline(child, opts))
         .join("");
      return `<li${className}>${content}</li>`;
   }

   // For loose lists (multiple blocks), keep block structure
   const content = node.children
      .map((child) => renderBlock(child, opts))
      .join("\n");
   return `<li${className}>\n${content}\n</li>`;
}

// =============================================================================
// Table Rendering (GFM Extension)
// =============================================================================

function renderTable(
   node: TableNode,
   opts: Required<HtmlRenderOptions>,
): string {
   const rows = node.children;
   const headerRow = rows.find((r) => r.isHeader);
   const bodyRows = rows.filter((r) => !r.isHeader);

   const className = opts.classPrefix
      ? ` class="${opts.classPrefix}table"`
      : "";
   let html = `<table${className}>`;

   if (headerRow) {
      html += "\n<thead>\n" + renderTableRow(headerRow, opts) + "\n</thead>";
   }

   if (bodyRows.length > 0) {
      html +=
         "\n<tbody>\n" +
         bodyRows.map((r) => renderTableRow(r, opts)).join("\n") +
         "\n</tbody>";
   }

   html += "\n</table>";
   return html;
}

function renderTableRow(
   node: TableRowNode,
   opts: Required<HtmlRenderOptions>,
): string {
   const cells = node.children
      .map((cell) => renderTableCell(cell, opts))
      .join("");
   return `<tr>${cells}</tr>`;
}

function renderTableCell(
   node: TableCellNode,
   opts: Required<HtmlRenderOptions>,
): string {
   const tag = node.isHeader ? "th" : "td";
   const alignStyle = node.align ? ` style="text-align: ${node.align}"` : "";
   const content = node.children
      .map((child) => renderInline(child, opts))
      .join("");
   return `<${tag}${alignStyle}>${content}</${tag}>`;
}

// =============================================================================
// Inline Rendering
// =============================================================================

function renderInline(
   node: InlineNode,
   opts: Required<HtmlRenderOptions>,
): string {
   switch (node.type) {
      case "text":
         return renderText(node);
      case "codeSpan":
         return renderCodeSpan(node, opts);
      case "emphasis":
         return renderEmphasis(node, opts);
      case "strong":
         return renderStrong(node, opts);
      case "link":
         return renderLink(node, opts);
      case "image":
         return renderImage(node, opts);
      case "hardBreak":
         return renderHardBreak();
      case "softBreak":
         return renderSoftBreak(opts);
      case "htmlInline":
         return renderHtmlInline(node, opts);
      default:
         return "";
   }
}

function renderText(node: TextNode): string {
   return encodeHtmlEntities(node.value);
}

function renderCodeSpan(
   node: CodeSpanNode,
   opts: Required<HtmlRenderOptions>,
): string {
   const className = opts.classPrefix ? ` class="${opts.classPrefix}code"` : "";
   return `<code${className}>${encodeHtmlEntities(node.value)}</code>`;
}

function renderEmphasis(
   node: EmphasisNode,
   opts: Required<HtmlRenderOptions>,
): string {
   const content = node.children
      .map((child) => renderInline(child, opts))
      .join("");
   const className = opts.classPrefix ? ` class="${opts.classPrefix}em"` : "";
   return `<em${className}>${content}</em>`;
}

function renderStrong(
   node: StrongNode,
   opts: Required<HtmlRenderOptions>,
): string {
   const content = node.children
      .map((child) => renderInline(child, opts))
      .join("");
   const className = opts.classPrefix
      ? ` class="${opts.classPrefix}strong"`
      : "";
   return `<strong${className}>${content}</strong>`;
}

function renderLink(node: LinkNode, opts: Required<HtmlRenderOptions>): string {
   const content = node.children
      .map((child) => renderInline(child, opts))
      .join("");
   const url = encodeHtmlEntities(opts.transformUrl(node.url, "link"));
   const title = node.title ? ` title="${encodeHtmlEntities(node.title)}"` : "";

   let extraAttrs = "";
   if (opts.externalLinksNewTab && isExternalUrl(node.url)) {
      extraAttrs = ' target="_blank" rel="noopener noreferrer"';
   }

   const customAttrs = buildAttributes(
      opts.elementAttributes.link,
      opts.classPrefix,
      "a",
   );
   return `<a href="${url}"${title}${extraAttrs}${customAttrs}>${content}</a>`;
}

function renderImage(
   node: ImageNode,
   opts: Required<HtmlRenderOptions>,
): string {
   const url = encodeHtmlEntities(opts.transformUrl(node.url, "image"));
   const alt = encodeHtmlEntities(node.alt);
   const title = node.title ? ` title="${encodeHtmlEntities(node.title)}"` : "";
   const attrs = buildAttributes(
      opts.elementAttributes.image,
      opts.classPrefix,
      "img",
   );
   return `<img src="${url}" alt="${alt}"${title}${attrs} />`;
}

function renderHardBreak(): string {
   return "<br />";
}

function renderSoftBreak(opts: Required<HtmlRenderOptions>): string {
   return opts.softBreakAsBr ? "<br />" : "\n";
}

function renderHtmlInline(
   node: HtmlInlineNode,
   opts: Required<HtmlRenderOptions>,
): string {
   if (opts.sanitizeHtml) {
      return encodeHtmlEntities(node.value);
   }
   return node.value;
}

// =============================================================================
// Utility Functions
// =============================================================================

function isExternalUrl(url: string): boolean {
   return url.startsWith("http://") || url.startsWith("https://");
}

/**
 * Generates a URL-friendly slug from heading text.
 * Used to create unique IDs for headings.
 */
function generateHeadingId(text: string): string {
   return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 50);
}

/**
 * Extracts plain text from inline nodes (for generating heading IDs).
 */
function extractTextContent(nodes: InlineNode[]): string {
   return nodes
      .map((node) => {
         if (node.type === "text") return node.value;
         if (node.type === "codeSpan") return node.value;
         if ("children" in node && Array.isArray(node.children)) {
            return extractTextContent(node.children);
         }
         return "";
      })
      .join("");
}

function buildAttributes(
   customAttrs: Record<string, string> | undefined,
   classPrefix: string,
   elementName: string,
): string {
   const attrs: string[] = [];

   if (classPrefix) {
      attrs.push(`class="${classPrefix}${elementName}"`);
   }

   if (customAttrs) {
      for (const [key, value] of Object.entries(customAttrs)) {
         attrs.push(`${key}="${encodeHtmlEntities(value)}"`);
      }
   }

   return attrs.length > 0 ? ` ${attrs.join(" ")}` : "";
}
