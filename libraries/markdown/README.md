# @f-o-t/markdown

A CommonMark compliant markdown parser with AST generation, streaming support, and bidirectional conversion (Markdown ↔ HTML).

## Installation

```bash
# npm
npm install @f-o-t/markdown

# pnpm
pnpm add @f-o-t/markdown

# bun
bun add @f-o-t/markdown
```

## Features

- **CommonMark compliant** - Full support for the CommonMark specification
- **GFM extensions** - Tables, task lists, strikethrough
- **Bidirectional conversion** - Parse markdown to AST, generate markdown from AST
- **HTML rendering** - Convert markdown AST to HTML with customization options
- **HTML to Markdown** - Convert HTML content back to markdown
- **Streaming support** - Process large files efficiently with streaming APIs
- **Batch processing** - Parse multiple files with progress events
- **Type-safe** - Full TypeScript support with Zod schemas for runtime validation
- **Zero dependencies** (except Zod for schema validation)

## Quick Start

### Parsing Markdown

```typescript
import { parse, parseOrThrow } from "@f-o-t/markdown";

// Safe parsing with result type
const result = parse("# Hello **World**");
if (result.success) {
  console.log(result.data.root.children);
}

// Throws on error
const doc = parseOrThrow("# Hello **World**");
console.log(doc.root.children);
```

### Generating Markdown

```typescript
import { generate, generateHeadingString, generateLinkString } from "@f-o-t/markdown";

// Generate from AST
const markdown = generate(doc);

// Helper functions for common elements
generateHeadingString(1, "Title");           // "# Title"
generateLinkString("Example", "https://example.com"); // "[Example](https://example.com)"
```

### HTML Rendering

```typescript
import { parse, renderToHtml } from "@f-o-t/markdown";

const doc = parse("# Hello **World**");
const html = renderToHtml(doc.data);
// => "<h1 id="hello-world">Hello <strong>World</strong></h1>"
```

### HTML to Markdown

```typescript
import { htmlToMarkdown } from "@f-o-t/markdown";

const markdown = htmlToMarkdown("<h1>Hello</h1><p>World</p>");
// => "# Hello\n\nWorld"
```

## API Reference

### Parsing

| Function | Description |
|----------|-------------|
| `parse(content, options?)` | Parses markdown, returns `{ success, data }` or `{ success, error }` |
| `parseOrThrow(content, options?)` | Parses markdown, throws on error |
| `parseToAst(content, options?)` | Returns just the AST root node |
| `parseBuffer(buffer, options?)` | Parses from `Uint8Array` with encoding detection |
| `parseBufferOrThrow(buffer, options?)` | Same as above, throws on error |
| `isValidMarkdown(content)` | Returns `true` if content can be parsed |

#### Parse Options

```typescript
interface ParseOptions {
  positions?: boolean;      // Include position info (default: true)
  preserveSource?: boolean; // Keep original source (default: false)
}
```

### Utility Functions

```typescript
import {
  extractText,
  countWords,
  getHeadings,
  getLinks,
  getImages,
  getCodeBlocks,
} from "@f-o-t/markdown";

extractText("**Hello** *world*");      // "Hello world"
countWords("Hello **world**!");        // 2
getHeadings("# Title\n## Section");    // [{ level: 1, text: "Title" }, ...]
getLinks("[Example](url)");            // [{ text: "Example", url: "url" }]
getImages("![Alt](image.png)");        // [{ alt: "Alt", url: "image.png" }]
getCodeBlocks("```js\ncode\n```");     // [{ lang: "js", code: "code" }]
```

### Generation

| Function | Description |
|----------|-------------|
| `generate(document, options?)` | Generates markdown from AST |
| `generateNode(node, options?)` | Generates markdown from any node |
| `createGenerator(options?)` | Creates incremental generator |

#### Generate Options

```typescript
interface GenerateOptions {
  lineEnding?: "\n" | "\r\n";   // Default: "\n"
  indent?: number;               // List indent (default: 3)
  setext?: boolean;              // Setext headings (default: false)
  fence?: "`" | "~";             // Code fence char (default: "`")
  fenceLength?: number;          // Fence length (default: 3)
  emphasis?: "*" | "_";          // Emphasis marker (default: "*")
  strong?: "**" | "__";          // Strong marker (default: "**")
  bullet?: "-" | "*" | "+";      // List bullet (default: "-")
}
```

#### String Helpers

```typescript
import {
  generateHeadingString,
  generateLinkString,
  generateImageString,
  generateCodeBlockString,
  generateListString,
  generateBlockquoteString,
  generateEmphasisString,
  generateStrongString,
  generateInlineCodeString,
  generateTableString,
  generateTaskListString,
  generateStrikethroughString,
} from "@f-o-t/markdown";

// Examples
generateHeadingString(2, "Section");              // "## Section"
generateCodeBlockString("const x = 1;", "js");    // "```js\nconst x = 1;\n```"
generateListString(["A", "B"], true);             // "1. A\n2. B"
generateTableString(["Name", "Age"], [["Alice", "30"]]);
generateTaskListString([{ text: "Done", checked: true }]);
```

### HTML Rendering

```typescript
import { renderToHtml, renderNodeToHtml } from "@f-o-t/markdown";

const html = renderToHtml(document, {
  sanitizeHtml: true,           // Escape raw HTML (default: true)
  externalLinksNewTab: false,   // Add target="_blank" (default: false)
  classPrefix: "",              // CSS class prefix
  softBreakAsBr: false,         // Render soft breaks as <br>
  transformUrl: (url, type) => url, // Custom URL transformer
  elementAttributes: {          // Custom attributes per element
    link: { rel: "nofollow" },
    image: { loading: "lazy" },
  },
});
```

### HTML to Markdown

```typescript
import { htmlToMarkdown, parseHtml, htmlAstToMarkdownAst } from "@f-o-t/markdown";

// Direct conversion
const markdown = htmlToMarkdown("<h1>Hello</h1>");

// Or step by step
const htmlAst = parseHtml("<h1>Hello</h1>");
const markdownAst = htmlAstToMarkdownAst(htmlAst);
```

### Streaming

```typescript
import {
  parseStream,
  parseStreamToDocument,
  parseBatchStream,
} from "@f-o-t/markdown";

// Stream from fetch
const response = await fetch("large-doc.md");
for await (const event of parseStream(response.body)) {
  if (event.type === "block") {
    console.log("Parsed block:", event.data.type);
  } else if (event.type === "complete") {
    console.log("Done!");
  }
}

// Collect to document
const doc = await parseStreamToDocument(response.body);

// Batch processing
const files = [
  { filename: "a.md", content: "# A" },
  { filename: "b.md", content: "# B" },
];
for await (const event of parseBatchStream(files)) {
  switch (event.type) {
    case "file_start":
      console.log(`Processing ${event.filename}`);
      break;
    case "file_complete":
      console.log(`Completed ${event.filename}`);
      break;
    case "batch_complete":
      console.log(`Done: ${event.totalFiles} files`);
      break;
  }
}
```

#### Stream Options

```typescript
interface StreamOptions {
  positions?: boolean;       // Include positions (default: true)
  maxBufferSize?: number;    // Max buffer size in bytes (default: 10MB)
  chunkSize?: number;        // Chunk size for batch (default: 64KB)
}
```

### AST Types

All node types are available as TypeScript types and Zod schemas:

```typescript
import type {
  MarkdownDocument,
  DocumentNode,
  BlockNode,
  InlineNode,
  HeadingNode,
  ParagraphNode,
  CodeBlockNode,
  ListNode,
  TableNode,
  // ... and more
} from "@f-o-t/markdown";

import {
  documentNodeSchema,
  headingNodeSchema,
  paragraphNodeSchema,
  // ... Zod schemas for validation
} from "@f-o-t/markdown";
```

### Utilities

```typescript
import {
  normalizeLineEndings,
  normalizeEscapedNewlines,
  normalizeMarkdownEmphasis,
} from "@f-o-t/markdown";

// Normalize to \n
normalizeLineEndings("hello\r\nworld"); // "hello\nworld"

// Convert escaped newlines to actual newlines
normalizeEscapedNewlines("hello\\nworld"); // "hello\nworld"
```

## CommonMark Compliance

This library implements the [CommonMark specification](https://commonmark.org/) with additional support for GFM (GitHub Flavored Markdown) extensions:

- **Block elements**: Headings, paragraphs, code blocks (fenced and indented), blockquotes, lists (ordered, unordered, task lists), thematic breaks, HTML blocks, tables
- **Inline elements**: Emphasis, strong emphasis, links, images, code spans, hard/soft breaks, HTML inline, strikethrough

## License

MIT
