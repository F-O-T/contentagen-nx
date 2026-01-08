// =============================================================================
// Parser Exports
// =============================================================================

export {
   // Convenience functions
   countWords,
   extractText,
   getCodeBlocks,
   getHeadings,
   getImages,
   getLinks,
   isValidMarkdown,
   // Main parser functions
   parse,
   parseBuffer,
   parseBufferOrThrow,
   parseOrThrow,
   parseToAst,
} from "./parser.ts";

// =============================================================================
// Generator Exports
// =============================================================================

export {
   // Main generator functions
   createGenerator,
   generate,
   // Convenience string generators
   generateBlockquoteString,
   generateCodeBlockString,
   generateEmphasisString,
   generateHeadingString,
   generateImageString,
   generateInlineCodeString,
   generateLinkString,
   generateListString,
   generateNode,
   generateStrongString,
} from "./generator.ts";

// =============================================================================
// Streaming Exports
// =============================================================================

export {
   parseBatchStream,
   parseBatchStreamToArray,
   parseBufferStream,
   parseStream,
   parseStreamToDocument,
} from "./stream.ts";

// =============================================================================
// Schema Exports
// =============================================================================

export {
   // Node schemas
   blockNodeSchema,
   blockquoteNodeSchema,
   codeBlockNodeSchema,
   codeSpanNodeSchema,
   // Constants
   DEFAULT_MAX_BUFFER_SIZE,
   documentNodeSchema,
   emphasisNodeSchema,
   // Option schemas
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
   textNodeSchema,
   thematicBreakNodeSchema,
} from "./schemas.ts";

// =============================================================================
// Type Exports
// =============================================================================

export type {
   // Batch processing
   BatchMarkdownFileInput,
   BatchMarkdownStreamEvent,
   BatchParsedMarkdownFile,
   // Block node types
   BlockNode,
   BlockquoteNode,
   CodeBlockNode,
   // Inline node types
   CodeSpanNode,
   // Document types
   DocumentNode,
   EmphasisNode,
   // Options
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
   // Union types
   LiteralNode,
   MarkdownDocument,
   Node,
   ParagraphNode,
   ParentNode,
   ParseOptions,
   Position,
   SoftBreakNode,
   // Streaming
   StreamEvent,
   StreamOptions,
   StrongNode,
   TextNode,
   ThematicBreakNode,
} from "./schemas.ts";

export type {
   // Internal types (useful for custom parsers)
   BlockContext,
   BlockParseResult,
   BlockParserState,
   Bracket,
   Delimiter,
   EncodingInfo,
   InlineParserState,
   InlineToken,
   LineInfo,
   OpenBlock,
   ParseResult,
} from "./types.ts";

// =============================================================================
// Utility Exports
// =============================================================================

export {
   // Pattern matching
   ATX_HEADING_REGEX,
   AUTOLINK_REGEX,
   BLOCKQUOTE_REGEX,
   COLLAPSED_LINK_REGEX,
   // HTML block detection
   closesHtmlBlock,
   // Line utilities
   countIndent,
   // Encoding utilities
   decodeBuffer,
   // Escaping utilities
   decodeHtmlEntities,
   decodeUrl,
   detectEncoding,
   detectLineEnding,
   EMAIL_AUTOLINK_REGEX,
   encodeHtmlEntities,
   encodeUrl,
   escapeMarkdown,
   FENCED_CODE_OPEN_REGEX,
   getHtmlBlockType,
   HTML_BLOCK_1_CLOSE,
   HTML_BLOCK_1_OPEN,
   HTML_BLOCK_2_CLOSE,
   HTML_BLOCK_2_OPEN,
   HTML_BLOCK_3_CLOSE,
   HTML_BLOCK_3_OPEN,
   HTML_BLOCK_4_CLOSE,
   HTML_BLOCK_4_OPEN,
   HTML_BLOCK_5_CLOSE,
   HTML_BLOCK_5_OPEN,
   HTML_BLOCK_6_OPEN,
   HTML_BLOCK_7_OPEN,
   INLINE_LINK_REGEX,
   isBlankLine,
   // Validation utilities
   isValidEmail,
   isValidUrl,
   LINK_REFERENCE_REGEX,
   normalizeLabel,
   normalizeLineEndings,
   ORDERED_LIST_REGEX,
   // String utilities
   padEnd,
   REFERENCE_LINK_REGEX,
   removeIndent,
   repeat,
   SETEXT_HEADING_REGEX,
   SHORTCUT_LINK_REGEX,
   splitLines,
   THEMATIC_BREAK_REGEX,
   UNORDERED_LIST_REGEX,
   unescapeMarkdown,
} from "./utils.ts";

// =============================================================================
// Block Parser Exports (for advanced use)
// =============================================================================

export {
   createBlockContext,
   isAtxHeading,
   isBlockquoteStart,
   isFencedCodeStart,
   isIndentedCode,
   isLinkReferenceDefinition,
   isListItemStart,
   isSetextUnderline,
   isThematicBreak,
   parseBlocks,
} from "./block-parser.ts";

// =============================================================================
// Inline Parser Exports (for advanced use)
// =============================================================================

export { parseInline } from "./inline-parser.ts";
