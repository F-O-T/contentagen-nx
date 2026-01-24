/**
 * Lexical Editor Theme Configuration
 *
 * Defines CSS class mappings for all Lexical node types.
 * These classes are applied to the editor DOM elements.
 */
import type { EditorThemeClasses } from "lexical";

export const editorTheme: EditorThemeClasses = {
   // Root
   root: "editor-root prose prose-slate dark:prose-invert max-w-none focus:outline-none",
   ltr: "editor-ltr",
   rtl: "editor-rtl",

   // Paragraph
   paragraph: "editor-paragraph mb-4 leading-relaxed",

   // Headings
   heading: {
      h1: "editor-h1 text-3xl font-bold mt-8 mb-4",
      h2: "editor-h2 text-2xl font-semibold mt-6 mb-3",
      h3: "editor-h3 text-xl font-medium mt-5 mb-2",
      h4: "editor-h4 text-lg font-medium mt-4 mb-2",
      h5: "editor-h5 text-base font-medium mt-3 mb-1",
      h6: "editor-h6 text-sm font-medium mt-2 mb-1",
   },

   // Quote
   quote: "editor-quote border-l-4 border-muted-foreground/30 pl-4 italic my-4 text-muted-foreground",

   // Lists
   list: {
      ul: "editor-ul list-disc list-inside my-4 space-y-1",
      ol: "editor-ol list-decimal list-inside my-4 space-y-1",
      nested: {
         listitem: "editor-nested-listitem ml-4",
      },
      listitem: "editor-listitem",
      listitemChecked:
         "editor-listitem-checked line-through text-muted-foreground",
      listitemUnchecked: "editor-listitem-unchecked",
      olDepth: [
         "editor-ol-depth-1",
         "editor-ol-depth-2",
         "editor-ol-depth-3",
         "editor-ol-depth-4",
         "editor-ol-depth-5",
      ],
   },

   // Text formatting
   text: {
      bold: "editor-bold font-bold",
      italic: "editor-italic italic",
      underline: "editor-underline underline",
      strikethrough: "editor-strikethrough line-through",
      underlineStrikethrough:
         "editor-underline-strikethrough underline line-through",
      code: "editor-inline-code bg-muted px-1.5 py-0.5 rounded font-mono text-sm",
      subscript: "editor-subscript text-xs align-sub",
      superscript: "editor-superscript text-xs align-super",
      highlight: "editor-highlight bg-yellow-200 dark:bg-yellow-900/50",
   },

   // Links
   link: "editor-link text-primary underline underline-offset-4 hover:text-primary/80 cursor-pointer",

   // Code
   code: "editor-code-block bg-muted rounded-lg p-4 my-4 font-mono text-sm overflow-x-auto",
   codeHighlight: {
      atrule: "editor-code-atrule text-purple-500",
      attr: "editor-code-attr text-yellow-500",
      boolean: "editor-code-boolean text-orange-500",
      builtin: "editor-code-builtin text-cyan-500",
      cdata: "editor-code-cdata text-gray-500",
      char: "editor-code-char text-green-500",
      class: "editor-code-class text-yellow-400",
      "class-name": "editor-code-class-name text-yellow-400",
      comment: "editor-code-comment text-gray-400 italic",
      constant: "editor-code-constant text-orange-400",
      deleted: "editor-code-deleted text-red-500",
      doctype: "editor-code-doctype text-gray-500",
      entity: "editor-code-entity text-orange-400",
      function: "editor-code-function text-blue-400",
      important: "editor-code-important text-red-500 font-bold",
      inserted: "editor-code-inserted text-green-500",
      keyword: "editor-code-keyword text-purple-400",
      namespace: "editor-code-namespace text-gray-400",
      number: "editor-code-number text-orange-400",
      operator: "editor-code-operator text-cyan-400",
      prolog: "editor-code-prolog text-gray-500",
      property: "editor-code-property text-blue-300",
      punctuation: "editor-code-punctuation text-gray-400",
      regex: "editor-code-regex text-yellow-400",
      selector: "editor-code-selector text-green-400",
      string: "editor-code-string text-green-400",
      symbol: "editor-code-symbol text-purple-400",
      tag: "editor-code-tag text-red-400",
      url: "editor-code-url text-cyan-400",
      variable: "editor-code-variable text-red-300",
   },

   // Table
   table: "editor-table w-full border-collapse my-4",
   tableCell: "editor-table-cell border border-border p-2",
   tableCellHeader:
      "editor-table-cell-header border border-border p-2 bg-muted font-semibold",
   tableRow: "editor-table-row",
   tableRowStriping: "editor-table-row-striping even:bg-muted/50",
   tableScrollableWrapper: "editor-table-scrollable overflow-x-auto",
   tableSelected: "editor-table-selected bg-primary/10",
   tableCellActionButton: "editor-table-action-button",
   tableCellActionButtonContainer: "editor-table-action-container",
   tableCellEditing: "editor-table-cell-editing ring-2 ring-primary",
   tableCellPrimarySelected: "editor-table-cell-primary-selected bg-primary/20",
   tableCellResizer: "editor-table-cell-resizer",
   tableCellSortedIndicator: "editor-table-sorted-indicator",

   // Horizontal rule
   hr: "editor-hr border-t border-border my-6",

   // Images (handled by custom node)
   image: "editor-image",

   // Hashtag
   hashtag: "editor-hashtag text-primary",

   // Mark/Highlight
   mark: "editor-mark bg-yellow-200 dark:bg-yellow-900/50",
   markOverlap: "editor-mark-overlap bg-yellow-300 dark:bg-yellow-800/50",

   // Embeddings
   embedBlock: {
      base: "editor-embed-block my-4",
      focus: "editor-embed-focus ring-2 ring-primary",
   },

   // Indent
   indent: "editor-indent ml-4",
};

/**
 * Ghost text specific styles (for FIM suggestions)
 */
export const ghostTextStyles = {
   container: "ghost-text-container",
   text: "ghost-text opacity-50 text-muted-foreground pointer-events-none select-none",
};

/**
 * Spelling error decoration styles
 */
export const spellingStyles = {
   error: "spelling-error underline decoration-wavy decoration-red-500 underline-offset-2",
   suggestion: "spelling-suggestion cursor-pointer hover:bg-muted",
};

/**
 * Diff view styles
 */
export const diffStyles = {
   added: "diff-added bg-green-500/20 text-green-700 dark:text-green-300",
   removed:
      "diff-removed bg-red-500/20 text-red-700 dark:text-red-300 line-through",
   unchanged: "diff-unchanged",
};
