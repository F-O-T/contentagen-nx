/**
 * @packages/markdown - Internal re-export of @f-o-t/markdown
 *
 * This package wraps the public @f-o-t/markdown library for internal use.
 */

export {
   countWords,
   extractText,
   // Generation
   generate,
   generateHeadingString,
   getHeadings,
   // Parsing
   parse,
   parseOrThrow,
   parseToAst,
} from "@f-o-t/markdown";
