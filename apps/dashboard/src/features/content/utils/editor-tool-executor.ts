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
} from "lexical";
import { $createImageNode, type ImageWidth } from "../nodes/image-node";
import { EXTENDED_TRANSFORMERS } from "../ui/content-editor";

/**
 * Tool call received from the Mastra agent
 */
export interface ToolCall {
   id: string;
   name: string;
   args: Record<string, unknown>;
}

/**
 * Result from the server after executing a tool
 */
export interface ServerToolResult {
   success: boolean;
   markdown?: string;
   insertedText?: string;
   position?: string;
   level?: string;
   text?: string;
   [key: string]: unknown;
}

/**
 * Result of executing an editor tool
 */
export interface ToolExecutionResult {
   success: boolean;
   message?: string;
   data?: unknown;
}

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
 * - insertImage -> placeholder for image handling
 *
 * Analysis tools (seo, readability, keyword-density) return data without modifying the editor.
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
            return executeInsertList(editor, args, serverResult);

         case "insertCodeBlock":
            return executeInsertCodeBlock(editor, args, serverResult);

         case "insertTable":
            return executeInsertTable(editor, args, serverResult);

         case "insertImage":
            return executeInsertImage(editor, args, serverResult);

         case "replaceText":
            return executeReplaceText(editor, args, serverResult);

         case "deleteText":
            return executeDeleteText(editor, args, serverResult);

         case "formatText":
            return executeFormatText(editor, args, serverResult);

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
 * Uses $convertFromMarkdownString to properly parse markdown including:
 * - Paragraph breaks (\n\n)
 * - Headings (##, ###)
 * - Bold (**text**)
 * - Lists (- item)
 * - And other markdown syntax
 */
function executeInsertText(
   editor: LexicalEditor,
   args: Record<string, unknown>,
   serverResult?: ServerToolResult,
): ToolExecutionResult {
   // Use markdown from server result if available, otherwise fall back to args.text
   const text = serverResult?.markdown || (args.text as string);
   const position = serverResult?.position || (args.position as string);

   editor.update(() => {
      const root = $getRoot();

      switch (position) {
         case "cursor": {
            // For cursor position, append markdown at end (simplified)
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
            // Insert at the beginning of the document
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
            // Insert at the end of the document
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
 * If serverResult contains markdown, insert that directly via markdown conversion.
 * Otherwise, create a heading node manually.
 */
function executeInsertHeading(
   editor: LexicalEditor,
   args: Record<string, unknown>,
   serverResult?: ServerToolResult,
): ToolExecutionResult {
   const text = args.text as string;
   const level = args.level as number;
   const position = (args.position as string) || "end";

   // If server provided markdown, use insertText logic with markdown
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

      if (position === "start") {
         const firstChild = root.getFirstChild();
         if (firstChild) {
            firstChild.insertBefore(heading);
         } else {
            root.append(heading);
         }
      } else if (position === "cursor") {
         const selection = $getSelection();
         if ($isRangeSelection(selection)) {
            const anchor = selection.anchor.getNode();
            anchor.getTopLevelElement()?.insertAfter(heading);
         } else {
            root.append(heading);
         }
      } else {
         root.append(heading);
      }
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
   _serverResult?: ServerToolResult,
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

      if (position === "start") {
         const firstChild = root.getFirstChild();
         if (firstChild) {
            firstChild.insertBefore(list);
         } else {
            root.append(list);
         }
      } else if (position === "cursor") {
         const selection = $getSelection();
         if ($isRangeSelection(selection)) {
            const anchor = selection.anchor.getNode();
            anchor.getTopLevelElement()?.insertAfter(list);
         } else {
            root.append(list);
         }
      } else {
         root.append(list);
      }
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
   _serverResult?: ServerToolResult,
): ToolExecutionResult {
   const code = args.code as string;
   const language = (args.language as string) || "plaintext";
   const position = (args.position as string) || "end";

   editor.update(() => {
      const root = $getRoot();
      const codeNode = $createCodeNode(language);
      codeNode.append($createTextNode(code));

      if (position === "start") {
         const firstChild = root.getFirstChild();
         if (firstChild) {
            firstChild.insertBefore(codeNode);
         } else {
            root.append(codeNode);
         }
      } else if (position === "cursor") {
         const selection = $getSelection();
         if ($isRangeSelection(selection)) {
            const anchor = selection.anchor.getNode();
            anchor.getTopLevelElement()?.insertAfter(codeNode);
         } else {
            root.append(codeNode);
         }
      } else {
         root.append(codeNode);
      }
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
   _serverResult?: ServerToolResult,
): ToolExecutionResult {
   const rows = args.rows as number;
   const columns = args.columns as number;
   const headers = args.headers as string[] | undefined;
   const position = (args.position as string) || "end";

   editor.update(() => {
      const root = $getRoot();
      const table = $createTableNode();

      // Create header row if headers provided
      if (headers && headers.length > 0) {
         const headerRow = $createTableRowNode();
         for (let i = 0; i < columns; i++) {
            const cell = $createTableCellNode(TableCellHeaderStates.ROW);
            cell.append($createTextNode(headers[i] || `Column ${i + 1}`));
            headerRow.append(cell);
         }
         table.append(headerRow);
      }

      // Create data rows
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

      if (position === "start") {
         const firstChild = root.getFirstChild();
         if (firstChild) {
            firstChild.insertBefore(table);
         } else {
            root.append(table);
         }
      } else if (position === "cursor") {
         const selection = $getSelection();
         if ($isRangeSelection(selection)) {
            const anchor = selection.anchor.getNode();
            anchor.getTopLevelElement()?.insertAfter(table);
         } else {
            root.append(table);
         }
      } else {
         root.append(table);
      }
   });

   return {
      success: true,
      message: `Inserted ${rows}x${columns} table`,
   };
}

/**
 * Insert an image into the editor
 */
function executeInsertImage(
   editor: LexicalEditor,
   args: Record<string, unknown>,
   _serverResult?: ServerToolResult,
): ToolExecutionResult {
   // Support both 'url' and 'src' parameter names
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

      if (position === "start") {
         const firstChild = root.getFirstChild();
         if (firstChild) {
            firstChild.insertBefore(imageNode);
         } else {
            root.append(imageNode);
         }
      } else if (position === "cursor") {
         const selection = $getSelection();
         if ($isRangeSelection(selection)) {
            const anchor = selection.anchor.getNode();
            anchor.getTopLevelElement()?.insertAfter(imageNode);
         } else {
            root.append(imageNode);
         }
      } else {
         // Default: end
         root.append(imageNode);
      }
   });

   return {
      success: true,
      message: `Inserted image: ${alt || "image"}`,
      data: { url, alt, caption, width },
   };
}

/**
 * Replace text by pattern or selection
 */
function executeReplaceText(
   editor: LexicalEditor,
   args: Record<string, unknown>,
   _serverResult?: ServerToolResult,
): ToolExecutionResult {
   const searchText = args.searchText as string;
   const replaceWith = args.replaceWith as string;
   const replaceAll = (args.replaceAll as boolean) ?? false;

   let replacementCount = 0;

   editor.update(() => {
      const root = $getRoot();
      const textContent = root.getTextContent();

      if (replaceAll) {
         // Replace all occurrences
         const occurrences = textContent.split(searchText).length - 1;
         replacementCount = occurrences;
      } else {
         // Replace first occurrence only
         if (textContent.includes(searchText)) {
            replacementCount = 1;
         }
      }

      // Walk through all text nodes and replace
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
 * Delete text by range or pattern
 */
function executeDeleteText(
   editor: LexicalEditor,
   args: Record<string, unknown>,
   _serverResult?: ServerToolResult,
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

      // Walk through all text nodes and delete matching text
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
 * Apply formatting to selected or matched text
 */
function executeFormatText(
   editor: LexicalEditor,
   args: Record<string, unknown>,
   _serverResult?: ServerToolResult,
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
               // For links, we need to wrap selection in a link node
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
