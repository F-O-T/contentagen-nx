/**
 * Editor Tool Executor
 *
 * Executes agent tool calls on the Lexical editor.
 * Maps tool names to Lexical operations for local execution.
 */
import { $createCodeNode } from "@lexical/code";
import { $createLinkNode } from "@lexical/link";
import {
   $createListItemNode,
   $createListNode,
   type ListType,
} from "@lexical/list";
import {
   $convertFromMarkdownString,
   $convertToMarkdownString,
} from "@lexical/markdown";
import { $createHeadingNode, type HeadingTagType } from "@lexical/rich-text";
import {
   $createTableCellNode,
   $createTableNode,
   $createTableRowNode,
   TableCellHeaderStates,
} from "@lexical/table";
import type { LexicalEditor } from "lexical";
import {
   $createTextNode,
   $getRoot,
   $getSelection,
   $isRangeSelection,
   type LexicalNode,
   type RootNode,
} from "lexical";
import { $createImageNode, type ImageWidth } from "../core/image-node";
import { EXTENDED_TRANSFORMERS } from "../core/transformers";
import type {
   ServerToolResult,
   ToolCall,
   ToolExecutionResult,
} from "../schemas";

/**
 * Execute an editor tool call inside the Lexical editor
 *
 * Maps tool names to Lexical operations:
 * - insertText -> creates text/paragraph nodes
 * - insertHeading -> creates heading nodes
 * - insertList -> creates list nodes
 * - insertCodeBlock -> creates code nodes
 * - insertTable -> creates table nodes
 * - replaceText -> finds and replaces text
 * - deleteText -> removes text
 * - formatText -> applies formatting
 * - insertImage -> creates image nodes
 *
 * Analysis tools return data without modifying the editor.
 */
export async function executeEditorTool(
   editor: LexicalEditor,
   toolCall: ToolCall,
   serverResult?: ServerToolResult,
): Promise<ToolExecutionResult> {
   const { name, args } = toolCall;

   try {
      switch (name) {
         case "insertText":
            return executeInsertText(editor, args, serverResult);

         case "insertHeading":
            return executeInsertHeading(editor, args, serverResult);

         case "insertList":
            return executeInsertList(editor, args);

         case "insertCodeBlock":
            return executeInsertCodeBlock(editor, args);

         case "insertTable":
            return executeInsertTable(editor, args);

         case "insertImage":
            return executeInsertImage(editor, args);

         case "replaceText":
            return executeReplaceText(editor, args);

         case "deleteText":
            return executeDeleteText(editor, args);

         case "formatText":
            return executeFormatText(editor, args);

         // Analysis tools return data without modifying editor
         case "seoScore":
         case "readability":
         case "keywordDensity":
            return {
               success: true,
               message: `Analysis complete: ${name}`,
               data: args,
            };

         // Research tools return data without modifying editor
         case "webSearch":
         case "webCrawl":
         case "serpAnalysis":
         case "competitorContent":
            return {
               success: true,
               message: `Research complete: ${name}`,
               data: args,
            };

         default:
            return {
               success: false,
               message: `Unknown tool: ${name}`,
            };
      }
   } catch (error) {
      return {
         success: false,
         message:
            error instanceof Error ? error.message : "Tool execution failed",
      };
   }
}

/**
 * Insert markdown text at a specific position
 */
function executeInsertText(
   editor: LexicalEditor,
   args: Record<string, unknown>,
   serverResult?: ServerToolResult,
): ToolExecutionResult {
   const text = serverResult?.markdown || (args.text as string);
   const position = serverResult?.position || (args.position as string);

   editor.update(() => {
      const root = $getRoot();

      switch (position) {
         case "cursor": {
            const existingMarkdown = $convertToMarkdownString(
               EXTENDED_TRANSFORMERS,
            );
            root.clear();
            const newMarkdown =
               existingMarkdown + (existingMarkdown ? "\n\n" : "") + text;
            $convertFromMarkdownString(newMarkdown, EXTENDED_TRANSFORMERS);
            break;
         }

         case "start": {
            const existingMarkdown = $convertToMarkdownString(
               EXTENDED_TRANSFORMERS,
            );
            root.clear();
            const newMarkdown =
               text + (existingMarkdown ? "\n\n" : "") + existingMarkdown;
            $convertFromMarkdownString(newMarkdown, EXTENDED_TRANSFORMERS);
            break;
         }

         default: {
            const existingMarkdown = $convertToMarkdownString(
               EXTENDED_TRANSFORMERS,
            );
            root.clear();
            const newMarkdown =
               existingMarkdown + (existingMarkdown ? "\n\n" : "") + text;
            $convertFromMarkdownString(newMarkdown, EXTENDED_TRANSFORMERS);
            break;
         }
      }
   });

   return {
      success: true,
      message: `Inserted markdown at ${position}`,
   };
}

/**
 * Insert a heading
 */
function executeInsertHeading(
   editor: LexicalEditor,
   args: Record<string, unknown>,
   serverResult?: ServerToolResult,
): ToolExecutionResult {
   const text = args.text as string;
   const level = args.level as number;
   const position = (args.position as string) || "end";

   if (serverResult?.markdown) {
      editor.update(() => {
         const root = $getRoot();
         const existingMarkdown = $convertToMarkdownString(
            EXTENDED_TRANSFORMERS,
         );

         let newMarkdown: string;
         if (position === "start") {
            newMarkdown =
               serverResult.markdown +
               (existingMarkdown ? "\n\n" : "") +
               existingMarkdown;
         } else {
            newMarkdown =
               existingMarkdown +
               (existingMarkdown ? "\n\n" : "") +
               serverResult.markdown;
         }

         root.clear();
         $convertFromMarkdownString(newMarkdown, EXTENDED_TRANSFORMERS);
      });

      return {
         success: true,
         message: `Inserted h${level} heading`,
      };
   }

   const headingTag = `h${Math.min(Math.max(level, 1), 6)}` as HeadingTagType;

   editor.update(() => {
      const root = $getRoot();
      const heading = $createHeadingNode(headingTag);
      heading.append($createTextNode(text));

      insertNodeAtPosition(root, heading, position);
   });

   return {
      success: true,
      message: `Inserted h${level} heading`,
   };
}

/**
 * Insert a list
 */
function executeInsertList(
   editor: LexicalEditor,
   args: Record<string, unknown>,
): ToolExecutionResult {
   const items = args.items as string[];
   const listType = args.listType as ListType;
   const position = (args.position as string) || "end";

   editor.update(() => {
      const root = $getRoot();
      const list = $createListNode(listType);

      for (const item of items) {
         const listItem = $createListItemNode();
         listItem.append($createTextNode(item));
         list.append(listItem);
      }

      insertNodeAtPosition(root, list, position);
   });

   return {
      success: true,
      message: `Inserted ${listType} list with ${items.length} items`,
   };
}

/**
 * Insert a code block
 */
function executeInsertCodeBlock(
   editor: LexicalEditor,
   args: Record<string, unknown>,
): ToolExecutionResult {
   const code = args.code as string;
   const language = (args.language as string) || "plaintext";
   const position = (args.position as string) || "end";

   editor.update(() => {
      const root = $getRoot();
      const codeNode = $createCodeNode(language);
      codeNode.append($createTextNode(code));

      insertNodeAtPosition(root, codeNode, position);
   });

   return {
      success: true,
      message: `Inserted code block with ${language} syntax`,
   };
}

/**
 * Insert a table
 */
function executeInsertTable(
   editor: LexicalEditor,
   args: Record<string, unknown>,
): ToolExecutionResult {
   const rows = args.rows as number;
   const columns = args.columns as number;
   const headers = args.headers as string[] | undefined;
   const position = (args.position as string) || "end";

   editor.update(() => {
      const root = $getRoot();
      const table = $createTableNode();

      if (headers && headers.length > 0) {
         const headerRow = $createTableRowNode();
         for (let i = 0; i < columns; i++) {
            const cell = $createTableCellNode(TableCellHeaderStates.ROW);
            cell.append($createTextNode(headers[i] || `Column ${i + 1}`));
            headerRow.append(cell);
         }
         table.append(headerRow);
      }

      const dataRows = headers ? rows - 1 : rows;
      for (let r = 0; r < dataRows; r++) {
         const row = $createTableRowNode();
         for (let c = 0; c < columns; c++) {
            const cell = $createTableCellNode(TableCellHeaderStates.NO_STATUS);
            cell.append($createTextNode(""));
            row.append(cell);
         }
         table.append(row);
      }

      insertNodeAtPosition(root, table, position);
   });

   return {
      success: true,
      message: `Inserted ${rows}x${columns} table`,
   };
}

/**
 * Insert an image
 */
function executeInsertImage(
   editor: LexicalEditor,
   args: Record<string, unknown>,
): ToolExecutionResult {
   const url = (args.url as string) || (args.src as string);
   const alt = (args.alt as string) || (args.altText as string) || "";
   const caption = args.caption as string | undefined;
   const position = (args.position as string) || "end";
   const width = (args.width as ImageWidth) || "full";

   if (!url) {
      return {
         success: false,
         message: "Image URL is required",
      };
   }

   editor.update(() => {
      const root = $getRoot();
      const imageNode = $createImageNode(url, alt, caption, width);

      insertNodeAtPosition(root, imageNode, position);
   });

   return {
      success: true,
      message: `Inserted image: ${alt || "image"}`,
      data: { url, alt, caption, width },
   };
}

/**
 * Replace text by pattern
 */
function executeReplaceText(
   editor: LexicalEditor,
   args: Record<string, unknown>,
): ToolExecutionResult {
   const searchText = args.searchText as string;
   const replaceWith = args.replaceWith as string;
   const replaceAll = (args.replaceAll as boolean) ?? false;

   let replacementCount = 0;

   editor.update(() => {
      const root = $getRoot();
      const textContent = root.getTextContent();

      if (replaceAll) {
         replacementCount = textContent.split(searchText).length - 1;
      } else {
         if (textContent.includes(searchText)) {
            replacementCount = 1;
         }
      }

      const walkAndReplace = (node: unknown) => {
         const lexicalNode = node as {
            getTextContent?: () => string;
            setTextContent?: (text: string) => void;
            getChildren?: () => unknown[];
         };

         if (lexicalNode.getTextContent && lexicalNode.setTextContent) {
            const content = lexicalNode.getTextContent();
            if (content.includes(searchText)) {
               if (replaceAll) {
                  lexicalNode.setTextContent(
                     content.replaceAll(searchText, replaceWith),
                  );
               } else {
                  lexicalNode.setTextContent(
                     content.replace(searchText, replaceWith),
                  );
               }
            }
         }

         if (lexicalNode.getChildren) {
            for (const child of lexicalNode.getChildren()) {
               walkAndReplace(child);
            }
         }
      };

      walkAndReplace(root);
   });

   return {
      success: true,
      message: `Replaced ${replacementCount} occurrence(s)`,
      data: { replacementCount },
   };
}

/**
 * Delete text by pattern
 */
function executeDeleteText(
   editor: LexicalEditor,
   args: Record<string, unknown>,
): ToolExecutionResult {
   const searchText = args.searchText as string | undefined;
   const deleteAll = (args.deleteAll as boolean) ?? false;

   if (!searchText) {
      return {
         success: false,
         message: "No search text provided for deletion",
      };
   }

   let deletionCount = 0;

   editor.update(() => {
      const root = $getRoot();

      const walkAndDelete = (node: unknown) => {
         const lexicalNode = node as {
            getTextContent?: () => string;
            setTextContent?: (text: string) => void;
            getChildren?: () => unknown[];
         };

         if (lexicalNode.getTextContent && lexicalNode.setTextContent) {
            const content = lexicalNode.getTextContent();
            if (content.includes(searchText)) {
               if (deleteAll) {
                  const occurrences = content.split(searchText).length - 1;
                  deletionCount += occurrences;
                  lexicalNode.setTextContent(
                     content.replaceAll(searchText, ""),
                  );
               } else if (deletionCount === 0) {
                  deletionCount = 1;
                  lexicalNode.setTextContent(content.replace(searchText, ""));
               }
            }
         }

         if (lexicalNode.getChildren) {
            for (const child of lexicalNode.getChildren()) {
               walkAndDelete(child);
            }
         }
      };

      walkAndDelete(root);
   });

   return {
      success: true,
      message: `Deleted ${deletionCount} occurrence(s)`,
      data: { deletionCount },
   };
}

/**
 * Apply formatting to selected text
 */
function executeFormatText(
   editor: LexicalEditor,
   args: Record<string, unknown>,
): ToolExecutionResult {
   const format = args.format as string;
   const text = args.text as string | undefined;
   const url = args.url as string | undefined;

   editor.update(() => {
      const selection = $getSelection();

      if (!$isRangeSelection(selection)) {
         return;
      }

      switch (format) {
         case "bold":
            selection.formatText("bold");
            break;
         case "italic":
            selection.formatText("italic");
            break;
         case "underline":
            selection.formatText("underline");
            break;
         case "strikethrough":
            selection.formatText("strikethrough");
            break;
         case "code":
            selection.formatText("code");
            break;
         case "link":
            if (url) {
               const selectedText = selection.getTextContent() || text || url;
               const linkNode = $createLinkNode(url);
               linkNode.append($createTextNode(selectedText));
               selection.insertNodes([linkNode]);
            }
            break;
      }
   });

   return {
      success: true,
      message: `Applied ${format} formatting`,
   };
}

/**
 * Get the current editor content as plain text
 */
export function getEditorContent(editor: LexicalEditor): string {
   let content = "";

   editor.getEditorState().read(() => {
      const root = $getRoot();
      content = root.getTextContent();
   });

   return content;
}

/**
 * Get the current editor content as markdown
 */
export function getEditorMarkdown(editor: LexicalEditor): string {
   let markdown = "";

   editor.getEditorState().read(() => {
      markdown = $convertToMarkdownString(EXTENDED_TRANSFORMERS);
   });

   return markdown;
}

/**
 * Get the current selection text
 */
export function getSelectionText(editor: LexicalEditor): string {
   let selectedText = "";

   editor.getEditorState().read(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
         selectedText = selection.getTextContent();
      }
   });

   return selectedText;
}

/**
 * Set editor content from markdown
 */
export function setEditorFromMarkdown(
   editor: LexicalEditor,
   markdown: string,
): void {
   editor.update(() => {
      const root = $getRoot();
      root.clear();
      $convertFromMarkdownString(markdown, EXTENDED_TRANSFORMERS);
   });
}

/**
 * Insert a node at the specified position in the editor
 * Reduces code duplication across insert functions
 */
function insertNodeAtPosition(
   root: RootNode,
   node: LexicalNode,
   position: string,
): void {
   if (position === "start") {
      const firstChild = root.getFirstChild();
      if (firstChild) {
         firstChild.insertBefore(node);
      } else {
         root.append(node);
      }
   } else if (position === "cursor") {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
         const anchor = selection.anchor.getNode();
         anchor.getTopLevelElement()?.insertAfter(node);
      } else {
         root.append(node);
      }
   } else {
      // Default to "end"
      root.append(node);
   }
}
