/**
 * @packages/markdown - Internal re-export of @f-o-t/markdown
 *
 * This package wraps the public @f-o-t/markdown library for internal use.
 */

export type { HtmlRenderOptions } from "@f-o-t/markdown";
export {
   // Generation
   generate,
   generateHeadingString,
   // Utilities
   normalizeEscapedNewlines,
   normalizeLineEndings,
   // Parsing
   parse,
   parseOrThrow,
   parseToAst,
   // HTML Rendering
   renderNodeToHtml,
   renderToHtml,
} from "@f-o-t/markdown";
