// =============================================================================
// Parser Exports
// =============================================================================

export {
   isValidMarkdown,
   parse,
   parseBuffer,
   parseBufferOrThrow,
   parseOrThrow,
   parseToAst,
} from "./parser";

// =============================================================================
// Generator Exports
// =============================================================================

export {
   createGenerator,
   generate,
   generateBlockquoteString,
   generateCodeBlockString,
   generateEmphasisString,
   generateHeadingString,
   generateImageString,
   generateInlineCodeString,
   generateLinkString,
   generateListString,
   generateNode,
   generateStrikethroughString,
   generateStrongString,
   generateTableString,
   generateTaskListString,
} from "./generator";

// =============================================================================
// HTML Renderer Exports
// =============================================================================

export type { HtmlRenderOptions } from "./html-renderer";
export { renderNodeToHtml, renderToHtml } from "./html-renderer";

// =============================================================================
// HTML to Markdown Parser Exports
// =============================================================================

export type { HtmlToMarkdownOptions } from "./html-parser";
export {
   htmlAstToMarkdownAst,
   htmlToMarkdown,
   parseHtml,
} from "./html-parser";

// =============================================================================
// Streaming Exports
// =============================================================================

export {
   parseBatchStream,
   parseBatchStreamToArray,
   parseBufferStream,
   parseStream,
   parseStreamToDocument,
} from "./stream";

// =============================================================================
// Schema Exports
// =============================================================================

export {
   blockNodeSchema,
   blockquoteNodeSchema,
   codeBlockNodeSchema,
   codeSpanNodeSchema,
   DEFAULT_MAX_BUFFER_SIZE,
   documentNodeSchema,
   emphasisNodeSchema,
   generateOptionsSchema,
   hardBreakNodeSchema,
   headingNodeSchema,
   htmlBlockNodeSchema,
   htmlInlineNodeSchema,
   imageNodeSchema,
   inlineNodeSchema,
   linkNodeSchema,
   linkReferenceDefinitionSchema,
   listItemNodeSchema,
   listNodeSchema,
   markdownDocumentSchema,
   paragraphNodeSchema,
   parseOptionsSchema,
   positionSchema,
   softBreakNodeSchema,
   streamOptionsSchema,
   strongNodeSchema,
   tableCellNodeSchema,
   tableNodeSchema,
   tableRowNodeSchema,
   textNodeSchema,
   thematicBreakNodeSchema,
} from "./schemas";

// =============================================================================
// Type Exports
// =============================================================================

export type {
   BatchMarkdownFileInput,
   BatchMarkdownStreamEvent,
   BatchParsedMarkdownFile,
   BlockNode,
   BlockquoteNode,
   CodeBlockNode,
   CodeSpanNode,
   DocumentNode,
   EmphasisNode,
   GenerateOptions,
   HardBreakNode,
   HeadingNode,
   HtmlBlockNode,
   HtmlInlineNode,
   ImageNode,
   InlineNode,
   LinkNode,
   LinkReferenceDefinition,
   ListItemNode,
   ListNode,
   LiteralNode,
   MarkdownDocument,
   Node,
   ParagraphNode,
   ParentNode,
   ParseOptions,
   Position,
   SoftBreakNode,
   StreamEvent,
   StreamOptions,
   StrongNode,
   TableCellNode,
   TableNode,
   TableRowNode,
   TextNode,
   ThematicBreakNode,
} from "./schemas";

export type { ParseResult } from "./types";

// =============================================================================
// Utility Exports
// =============================================================================

export {
   normalizeEscapedNewlines,
   normalizeLineEndings,
   normalizeMarkdownEmphasis,
} from "./utils";
