# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-01-12

### Added

#### Parsing
- `parse()` - Safe markdown parsing with result type
- `parseOrThrow()` - Markdown parsing that throws on error
- `parseToAst()` - Parse and return just the AST root node
- `parseBuffer()` / `parseBufferOrThrow()` - Parse from `Uint8Array` with automatic encoding detection (UTF-8, UTF-16LE, UTF-16BE)
- `isValidMarkdown()` - Validate if content can be parsed as markdown

#### Utility Functions
- `extractText()` - Extract plain text from markdown (strips formatting)
- `countWords()` - Count words in markdown content
- `getHeadings()` - Extract all headings with levels
- `getLinks()` - Extract all links with text and URLs
- `getImages()` - Extract all images with alt text and URLs
- `getCodeBlocks()` - Extract all code blocks with language info

#### Generation
- `generate()` - Generate markdown string from AST
- `generateNode()` - Generate markdown from any AST node
- `createGenerator()` - Create incremental generator with streaming output
- String helper functions:
  - `generateHeadingString()` - Create heading strings (ATX and setext styles)
  - `generateLinkString()` - Create link strings
  - `generateImageString()` - Create image strings
  - `generateCodeBlockString()` - Create code blocks (fenced and indented)
  - `generateListString()` - Create ordered and unordered lists
  - `generateBlockquoteString()` - Create blockquotes
  - `generateEmphasisString()` - Create emphasis (italic)
  - `generateStrongString()` - Create strong emphasis (bold)
  - `generateInlineCodeString()` - Create inline code
  - `generateTableString()` - Create GFM tables with alignment
  - `generateTaskListString()` - Create task lists (checklists)
  - `generateStrikethroughString()` - Create strikethrough text

#### HTML Rendering
- `renderToHtml()` - Render markdown document to HTML
- `renderNodeToHtml()` - Render any AST node to HTML
- Rendering options:
  - HTML sanitization (enabled by default)
  - External links open in new tab
  - Custom class prefixes
  - Soft break as `<br>` option
  - Custom URL transformers
  - Custom element attributes

#### HTML to Markdown
- `htmlToMarkdown()` - Convert HTML string to markdown
- `parseHtml()` - Parse HTML to AST
- `htmlAstToMarkdownAst()` - Convert HTML AST to markdown AST

#### Streaming
- `parseStream()` - Stream-based parsing from `ReadableStream` or `AsyncIterable`
- `parseStreamToDocument()` - Parse stream and collect into document
- `parseBufferStream()` - Create streaming parser from buffer
- `parseBatchStream()` - Batch process multiple files with progress events
- `parseBatchStreamToArray()` - Batch process and collect results

#### Type System
- Full TypeScript support with exported types for all AST nodes
- Zod schemas for runtime validation:
  - Document, block, and inline node schemas
  - Parse options schema
  - Generate options schema
  - Stream options schema

#### Utilities
- `normalizeLineEndings()` - Normalize line endings to `\n`
- `normalizeEscapedNewlines()` - Convert escaped `\n` to actual newlines
- `normalizeMarkdownEmphasis()` - Normalize emphasis markers

### CommonMark Support
- Full CommonMark specification compliance
- GFM extensions: tables, task lists, strikethrough
- Block elements: headings (ATX & setext), paragraphs, code blocks (fenced & indented), blockquotes, lists, thematic breaks, HTML blocks
- Inline elements: emphasis, strong, links, images, code spans, hard/soft breaks, HTML inline
