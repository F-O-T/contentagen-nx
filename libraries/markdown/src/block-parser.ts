import { parseInline } from "./inline-parser";
import type {
   BlockNode,
   BlockquoteNode,
   CodeBlockNode,
   HeadingNode,
   HtmlBlockNode,
   ListItemNode,
   ListNode,
   ParagraphNode,
   Position,
   TableCellNode,
   TableNode,
   TableRowNode,
   ThematicBreakNode,
} from "./schemas";
import type { BlockContext, LineInfo } from "./types";
import {
   ATX_HEADING_REGEX,
   BLOCKQUOTE_REGEX,
   closesHtmlBlock,
   countIndent,
   FENCED_CODE_OPEN_REGEX,
   getHtmlBlockType,
   isBlankLine,
   LINK_REFERENCE_REGEX,
   ORDERED_LIST_REGEX,
   removeIndent,
   SETEXT_HEADING_REGEX,
   splitLines,
   THEMATIC_BREAK_REGEX,
   UNORDERED_LIST_REGEX,
} from "./utils";

// =============================================================================
// Block Context
// =============================================================================

/**
 * Creates a new block parsing context.
 */
export function createBlockContext(): BlockContext {
   return {
      lineNumber: 1,
      column: 1,
      indent: 0,
      tight: true,
      inBlockquote: false,
      listDepth: 0,
      blockquoteDepth: 0,
      references: new Map(),
   };
}

// =============================================================================
// Position Tracking
// =============================================================================

/**
 * Creates a position object from line info.
 * Uses pre-calculated line offsets for O(1) lookup instead of O(n) recalculation.
 */
function createPosition(startLine: LineInfo, endLine: LineInfo): Position {
   return {
      startLine: startLine.lineNumber,
      startColumn: 1,
      endLine: endLine.lineNumber,
      endColumn: endLine.raw.length + 1,
      startOffset: startLine.offset,
      endOffset: endLine.offset + endLine.raw.length,
   };
}

// =============================================================================
// Block Type Detection
// =============================================================================

/**
 * Checks if a line starts a thematic break.
 */
export function isThematicBreak(line: string): boolean {
   return THEMATIC_BREAK_REGEX.test(line.trim());
}

/**
 * Checks if a line starts an ATX heading.
 */
export function isAtxHeading(line: string): RegExpExecArray | null {
   return ATX_HEADING_REGEX.exec(line.trim());
}

/**
 * Checks if a line is a setext heading underline.
 */
export function isSetextUnderline(line: string): RegExpExecArray | null {
   return SETEXT_HEADING_REGEX.exec(line.trim());
}

/**
 * Checks if a line starts a fenced code block.
 */
export function isFencedCodeStart(line: string): RegExpExecArray | null {
   const trimmed = line.trimStart();
   const indent = countIndent(line);
   if (indent >= 4) return null; // Indented code, not fenced
   return FENCED_CODE_OPEN_REGEX.exec(trimmed);
}

/**
 * Checks if a line starts an indented code block.
 */
export function isIndentedCode(line: string, context: BlockContext): boolean {
   return countIndent(line) >= 4 && !context.inBlockquote;
}

/**
 * Checks if a line starts a blockquote.
 */
export function isBlockquoteStart(line: string): boolean {
   return BLOCKQUOTE_REGEX.test(line.trimStart());
}

/**
 * Checks if a line starts a list item.
 */
export function isListItemStart(
   line: string,
): { ordered: boolean; marker: string; start?: number; indent: number } | null {
   const trimmed = line.trimStart();
   const leadingIndent = countIndent(line);

   const ordered = ORDERED_LIST_REGEX.exec(trimmed);
   if (ordered) {
      return {
         ordered: true,
         marker: ordered[2] as ")" | ".",
         start: Number.parseInt(ordered[1] ?? "1", 10),
         indent: leadingIndent + (ordered[0]?.length ?? 0),
      };
   }

   const unordered = UNORDERED_LIST_REGEX.exec(trimmed);
   if (unordered) {
      return {
         ordered: false,
         marker: unordered[1] as "-" | "*" | "+",
         indent: leadingIndent + (unordered[0]?.length ?? 0),
      };
   }

   return null;
}

/**
 * Checks if a line is a link reference definition.
 */
export function isLinkReferenceDefinition(
   line: string,
): { label: string; url: string; title?: string } | null {
   const match = LINK_REFERENCE_REGEX.exec(line.trim());
   if (!match) return null;

   return {
      label: match[1] ?? "",
      url: match[2] ?? "",
      title: match[3] ?? match[4] ?? match[5],
   };
}

// =============================================================================
// Table Detection (GFM Extension)
// =============================================================================

/**
 * Regex for table delimiter row: | --- | :---: | ---: |
 */
const TABLE_DELIMITER_REGEX = /^\|?\s*:?-+:?\s*(?:\|\s*:?-+:?\s*)*\|?\s*$/;

/**
 * Checks if a line looks like a table row (contains pipes).
 */
export function isTableRow(line: string): boolean {
   const trimmed = line.trim();
   return trimmed.includes("|");
}

/**
 * Checks if a line is a table delimiter row.
 */
export function isTableDelimiter(line: string): boolean {
   return TABLE_DELIMITER_REGEX.test(line.trim());
}

/**
 * Parses alignment from a delimiter cell.
 */
function parseAlignment(cell: string): "left" | "center" | "right" | null {
   const trimmed = cell.trim();
   const hasLeft = trimmed.startsWith(":");
   const hasRight = trimmed.endsWith(":");

   if (hasLeft && hasRight) return "center";
   if (hasRight) return "right";
   if (hasLeft) return "left";
   return null;
}

/**
 * Splits a table row into cells.
 */
function splitTableRow(line: string): string[] {
   // Remove leading/trailing pipes if present
   let content = line.trim();
   if (content.startsWith("|")) content = content.slice(1);
   if (content.endsWith("|")) content = content.slice(0, -1);

   // Split by pipe, handling escaped pipes
   const cells: string[] = [];
   let current = "";
   let escaped = false;

   for (const char of content) {
      if (escaped) {
         current += char;
         escaped = false;
      } else if (char === "\\") {
         escaped = true;
         current += char;
      } else if (char === "|") {
         cells.push(current.trim());
         current = "";
      } else {
         current += char;
      }
   }
   cells.push(current.trim());

   return cells;
}

// =============================================================================
// Block Parsing Functions
// =============================================================================

/**
 * Maximum nesting depth to prevent stack overflow on pathological input.
 */
const MAX_NESTING_DEPTH = 100;

/**
 * Pre-scans content to collect all link reference definitions.
 * This allows forward references to work correctly.
 */
function collectReferences(lines: LineInfo[], context: BlockContext): void {
   for (const line of lines) {
      if (isBlankLine(line.raw)) continue;

      const refMatch = isLinkReferenceDefinition(line.raw);
      if (refMatch) {
         const normalizedLabel = refMatch.label
            .toLowerCase()
            .replace(/\s+/g, " ");
         context.references.set(normalizedLabel, {
            url: refMatch.url,
            title: refMatch.title,
         });
      }
   }
}

/**
 * Parses all blocks from content.
 */
export function parseBlocks(
   content: string,
   context?: BlockContext,
   includePositions = true,
   depth = 0,
): {
   blocks: BlockNode[];
   references: Map<string, { url: string; title?: string }>;
} {
   // Prevent stack overflow on deeply nested content
   if (depth > MAX_NESTING_DEPTH) {
      return { blocks: [], references: context?.references ?? new Map() };
   }

   const ctx = context ?? createBlockContext();
   const lines = splitLines(content);

   // First pass: collect all reference definitions
   collectReferences(lines, ctx);

   // Second pass: parse blocks (references are now available)
   const blocks: BlockNode[] = [];
   let i = 0;

   while (i < lines.length) {
      const result = parseBlock(lines, i, ctx, includePositions, depth);
      if (result.block) {
         blocks.push(result.block);
      }
      i += result.consumed;
   }

   return { blocks, references: ctx.references };
}

/**
 * Parses a single block starting at the given line index.
 */
function parseBlock(
   lines: LineInfo[],
   startIndex: number,
   context: BlockContext,
   includePositions: boolean,
   depth: number,
): { block: BlockNode | null; consumed: number } {
   const line = lines[startIndex];
   if (!line) {
      return { block: null, consumed: 1 };
   }

   // Skip blank lines
   if (line.isBlank) {
      return { block: null, consumed: 1 };
   }

   const content = line.content;

   // Check for thematic break
   if (isThematicBreak(content)) {
      return parseThematicBreak(line, includePositions);
   }

   // Check for ATX heading
   const atxMatch = isAtxHeading(content);
   if (atxMatch) {
      return parseAtxHeading(line, atxMatch, context, includePositions);
   }

   // Check for fenced code block
   const fenceMatch = isFencedCodeStart(line.raw);
   if (fenceMatch) {
      return parseFencedCodeBlock(
         lines,
         startIndex,
         fenceMatch,
         includePositions,
      );
   }

   // Check for HTML block
   const htmlType = getHtmlBlockType(content);
   if (htmlType > 0 && line.indent < 4) {
      return parseHtmlBlock(lines, startIndex, htmlType, includePositions);
   }

   // Check for blockquote
   if (isBlockquoteStart(line.raw)) {
      return parseBlockquote(
         lines,
         startIndex,
         context,
         includePositions,
         depth,
      );
   }

   // Check for list item
   const listMatch = isListItemStart(line.raw);
   if (listMatch) {
      return parseList(
         lines,
         startIndex,
         listMatch,
         context,
         includePositions,
         depth,
      );
   }

   // Check for indented code block (must come after list check)
   if (line.indent >= 4 && !context.inBlockquote) {
      return parseIndentedCodeBlock(lines, startIndex, includePositions);
   }

   // Check for GFM table (before link reference and paragraph)
   if (isTableRow(line.content)) {
      const tableResult = parseTable(
         lines,
         startIndex,
         context,
         includePositions,
      );
      if (tableResult.block) {
         return tableResult;
      }
   }

   // Check for link reference definition
   const refMatch = isLinkReferenceDefinition(line.raw);
   if (refMatch) {
      const normalizedLabel = refMatch.label.toLowerCase().replace(/\s+/g, " ");
      context.references.set(normalizedLabel, {
         url: refMatch.url,
         title: refMatch.title,
      });
      return { block: null, consumed: 1 };
   }

   // Default to paragraph (may be setext heading)
   return parseParagraph(lines, startIndex, context, includePositions);
}

/**
 * Parses a thematic break.
 */
function parseThematicBreak(
   line: LineInfo,
   includePositions: boolean,
): { block: ThematicBreakNode; consumed: number } {
   const content = line.content.trim();
   let marker: "-" | "*" | "_" = "-";
   if (content.includes("*")) marker = "*";
   else if (content.includes("_")) marker = "_";

   const node: ThematicBreakNode = {
      type: "thematicBreak",
      marker,
   };

   if (includePositions) {
      node.position = createPosition(line, line);
   }

   return { block: node, consumed: 1 };
}

/**
 * Parses an ATX heading.
 */
function parseAtxHeading(
   line: LineInfo,
   match: RegExpExecArray,
   context: BlockContext,
   includePositions: boolean,
): { block: HeadingNode; consumed: number } {
   const level = (match[1]?.length ?? 1) as 1 | 2 | 3 | 4 | 5 | 6;
   let text = match[2] ?? "";

   // Remove trailing # sequence
   text = text
      .replace(/[ \t]+#+[ \t]*$/, "")
      .replace(/#+[ \t]*$/, "")
      .trim();

   const node: HeadingNode = {
      type: "heading",
      level,
      children: parseInline(text, context.references),
      style: "atx",
   };

   if (includePositions) {
      node.position = createPosition(line, line);
   }

   return { block: node, consumed: 1 };
}

/**
 * Parses a fenced code block.
 */
function parseFencedCodeBlock(
   lines: LineInfo[],
   startIndex: number,
   match: RegExpExecArray,
   includePositions: boolean,
): { block: CodeBlockNode; consumed: number } {
   const startLine = lines[startIndex];
   if (!startLine) {
      return {
         block: {
            type: "codeBlock",
            value: "",
            style: "fenced",
            fence: "`",
            fenceLength: 3,
         },
         consumed: 1,
      };
   }

   const fence = match[1]?.[0] as "`" | "~";
   const fenceLength = match[1]?.length ?? 3;
   const infoString = (match[2] ?? "").trim();

   // Parse info string for language and meta
   const spaceIndex = infoString.indexOf(" ");
   let lang: string | undefined;
   let meta: string | undefined;

   if (infoString) {
      if (spaceIndex > 0) {
         lang = infoString.slice(0, spaceIndex);
         meta = infoString.slice(spaceIndex + 1).trim();
      } else {
         lang = infoString;
      }
   }

   const indent = countIndent(startLine.raw);
   const contentLines: string[] = [];
   let i = startIndex + 1;

   // Pre-compile the closing fence regex once
   const closingFenceRegex = new RegExp(`^${fence}{${fenceLength},}[ \\t]*$`);

   // Find closing fence
   while (i < lines.length) {
      const line = lines[i];
      if (!line) break;

      const lineIndent = countIndent(line.raw);
      const trimmed = line.raw.trimStart();

      // Check for closing fence
      if (closingFenceRegex.test(trimmed) && lineIndent < 4) {
         i++;
         break;
      }

      // Remove indent up to the fence indent
      const contentLine = removeIndent(line.raw, Math.min(indent, line.indent));
      contentLines.push(contentLine);
      i++;
   }

   const node: CodeBlockNode = {
      type: "codeBlock",
      value: contentLines.join("\n"),
      style: "fenced",
      fence,
      fenceLength,
   };

   if (lang) node.lang = lang;
   if (meta) node.meta = meta;

   if (includePositions) {
      const endLine = lines[i - 1] ?? startLine;
      node.position = createPosition(startLine, endLine);
   }

   return { block: node, consumed: i - startIndex };
}

/**
 * Parses an indented code block.
 */
function parseIndentedCodeBlock(
   lines: LineInfo[],
   startIndex: number,
   includePositions: boolean,
): { block: CodeBlockNode; consumed: number } {
   const contentLines: string[] = [];
   let i = startIndex;
   let lastNonBlankIndex = startIndex;

   while (i < lines.length) {
      const line = lines[i];
      if (!line) break;

      if (line.isBlank) {
         contentLines.push("");
         i++;
         continue;
      }

      if (line.indent < 4) {
         break;
      }

      contentLines.push(removeIndent(line.raw, 4));
      lastNonBlankIndex = i;
      i++;
   }

   // Trim trailing blank lines
   const trimmedContent = contentLines.slice(
      0,
      lastNonBlankIndex - startIndex + 1,
   );

   const node: CodeBlockNode = {
      type: "codeBlock",
      value: trimmedContent.join("\n"),
      style: "indented",
   };

   if (includePositions) {
      const startLine = lines[startIndex];
      const endLine = lines[lastNonBlankIndex] ?? startLine;
      if (startLine && endLine) {
         node.position = createPosition(startLine, endLine);
      }
   }

   return { block: node, consumed: i - startIndex };
}

/**
 * Parses a GFM table.
 */
function parseTable(
   lines: LineInfo[],
   startIndex: number,
   context: BlockContext,
   includePositions: boolean,
): { block: TableNode | null; consumed: number } {
   // Need at least 2 lines for a valid table (header + delimiter)
   if (startIndex + 1 >= lines.length) {
      return { block: null, consumed: 0 };
   }

   const headerLine = lines[startIndex];
   const delimiterLine = lines[startIndex + 1];

   if (!headerLine || !delimiterLine) {
      return { block: null, consumed: 0 };
   }

   // Check if first line looks like a table row and second is delimiter
   if (
      !isTableRow(headerLine.content) ||
      !isTableDelimiter(delimiterLine.content)
   ) {
      return { block: null, consumed: 0 };
   }

   // Parse header cells
   const headerCells = splitTableRow(headerLine.content);

   // Parse delimiter to get alignments
   const delimiterCells = splitTableRow(delimiterLine.content);

   // Number of columns must match
   if (
      headerCells.length !== delimiterCells.length ||
      headerCells.length === 0
   ) {
      return { block: null, consumed: 0 };
   }

   // Validate delimiter cells (must contain at least one dash)
   for (const cell of delimiterCells) {
      if (!/^:?-+:?$/.test(cell.trim())) {
         return { block: null, consumed: 0 };
      }
   }

   // Get alignments from delimiter row
   const alignments: Array<"left" | "center" | "right" | null> =
      delimiterCells.map(parseAlignment);

   // Create header row
   const headerRowCells: TableCellNode[] = headerCells.map((cell, idx) => ({
      type: "tableCell" as const,
      children: parseInline(cell, context.references),
      align: alignments[idx] ?? undefined,
      isHeader: true,
   }));

   const headerRow: TableRowNode = {
      type: "tableRow",
      children: headerRowCells,
      isHeader: true,
   };

   if (includePositions && headerLine) {
      headerRow.position = createPosition(headerLine, headerLine);
   }

   const rows: TableRowNode[] = [headerRow];
   let i = startIndex + 2; // Start after header and delimiter

   // Parse body rows
   while (i < lines.length) {
      const line = lines[i];
      if (!line) break;

      // Stop on blank line or non-table row
      if (line.isBlank || !isTableRow(line.content)) {
         break;
      }

      // Also stop if it looks like a new block element
      if (isThematicBreak(line.content) || isAtxHeading(line.content)) {
         break;
      }

      const cells = splitTableRow(line.content);

      // Create cells, padding or truncating to match header length
      const rowCells: TableCellNode[] = [];
      for (let j = 0; j < headerCells.length; j++) {
         const cellContent = cells[j] ?? "";
         rowCells.push({
            type: "tableCell",
            children: parseInline(cellContent, context.references),
            align: alignments[j] ?? undefined,
            isHeader: false,
         });
      }

      const bodyRow: TableRowNode = {
         type: "tableRow",
         children: rowCells,
         isHeader: false,
      };

      if (includePositions) {
         bodyRow.position = createPosition(line, line);
      }

      rows.push(bodyRow);
      i++;
   }

   const node: TableNode = {
      type: "table",
      children: rows,
      align: alignments,
   };

   if (includePositions) {
      const endLine = lines[i - 1] ?? headerLine;
      node.position = createPosition(headerLine, endLine);
   }

   return { block: node, consumed: i - startIndex };
}

/**
 * Parses an HTML block.
 */
function parseHtmlBlock(
   lines: LineInfo[],
   startIndex: number,
   htmlType: number,
   includePositions: boolean,
): { block: HtmlBlockNode; consumed: number } {
   const contentLines: string[] = [];
   let i = startIndex;

   while (i < lines.length) {
      const line = lines[i];
      if (!line) break;

      contentLines.push(line.raw);

      // Check for closing condition
      if (closesHtmlBlock(line.raw, htmlType)) {
         if (htmlType === 6 || htmlType === 7) {
            // Types 6 and 7 close on blank line, don't include it
            contentLines.pop();
         }
         i++;
         break;
      }

      i++;
   }

   const node: HtmlBlockNode = {
      type: "htmlBlock",
      value: contentLines.join("\n"),
      htmlType,
   };

   if (includePositions) {
      const startLine = lines[startIndex];
      const endLine = lines[i - 1] ?? startLine;
      if (startLine && endLine) {
         node.position = createPosition(startLine, endLine);
      }
   }

   return { block: node, consumed: i - startIndex };
}

/**
 * Parses a blockquote.
 */
function parseBlockquote(
   lines: LineInfo[],
   startIndex: number,
   context: BlockContext,
   includePositions: boolean,
   depth: number,
): { block: BlockquoteNode; consumed: number } {
   const quoteLines: string[] = [];
   let i = startIndex;
   let hadBlankLine = false;

   while (i < lines.length) {
      const line = lines[i];
      if (!line) break;

      // Remove blockquote marker
      const match = BLOCKQUOTE_REGEX.exec(line.raw.trimStart());
      if (match) {
         const content = line.raw.trimStart().slice(match[0].length);
         quoteLines.push(content);
         i++;
         continue;
      }

      // Lazy continuation (non-blank line without marker)
      if (!line.isBlank && !hadBlankLine) {
         quoteLines.push(line.raw);
         i++;
         continue;
      }

      if (line.isBlank) {
         hadBlankLine = true;
         // Check if next line continues the blockquote
         const nextLine = lines[i + 1];
         if (nextLine && BLOCKQUOTE_REGEX.test(nextLine.raw.trimStart())) {
            quoteLines.push("");
            i++;
            continue;
         }
      }

      break;
   }

   // Parse the content within the blockquote
   const innerContent = quoteLines.join("\n");
   const innerContext = {
      ...context,
      inBlockquote: true,
      blockquoteDepth: context.blockquoteDepth + 1,
   };
   const { blocks } = parseBlocks(
      innerContent,
      innerContext,
      includePositions,
      depth + 1,
   );

   const node: BlockquoteNode = {
      type: "blockquote",
      children: blocks,
   };

   if (includePositions) {
      const startLine = lines[startIndex];
      const endLine = lines[i - 1];
      if (startLine && endLine) {
         node.position = createPosition(startLine, endLine);
      }
   }

   return { block: node, consumed: i - startIndex };
}

/**
 * Parses a list.
 */
function parseList(
   lines: LineInfo[],
   startIndex: number,
   firstItem: {
      ordered: boolean;
      marker: string;
      start?: number;
      indent: number;
   },
   context: BlockContext,
   includePositions: boolean,
   depth: number,
): { block: ListNode; consumed: number } {
   const items: ListItemNode[] = [];
   let i = startIndex;
   let spread = false;
   let hadBlankBetweenItems = false;

   while (i < lines.length) {
      const line = lines[i];
      if (!line) break;

      // Check for blank line
      if (line.isBlank) {
         hadBlankBetweenItems = true;
         i++;
         continue;
      }

      // Check for list item
      const itemMatch = isListItemStart(line.raw);

      // Must match same list type and marker family
      if (itemMatch) {
         const sameType = itemMatch.ordered === firstItem.ordered;
         const sameMarkerFamily =
            firstItem.ordered ||
            itemMatch.marker === firstItem.marker ||
            ["-", "*", "+"].includes(itemMatch.marker);

         if (!sameType || !sameMarkerFamily) {
            break;
         }

         // Parse list item
         const { item, consumed } = parseListItem(
            lines,
            i,
            itemMatch.indent,
            itemMatch.marker as "-" | "*" | "+" | ")" | ".",
            context,
            includePositions,
            depth,
         );

         if (hadBlankBetweenItems && items.length > 0) {
            spread = true;
         }

         items.push(item);
         i += consumed;
         hadBlankBetweenItems = false;
         continue;
      }

      // Check for continuation (indented content)
      if (line.indent >= firstItem.indent) {
         // This should be handled by parseListItem
         break;
      }

      break;
   }

   const node: ListNode = {
      type: "list",
      ordered: firstItem.ordered,
      children: items,
      marker: firstItem.marker as "-" | "*" | "+" | ")" | ".",
      spread,
   };

   if (firstItem.ordered && firstItem.start !== undefined) {
      node.start = firstItem.start;
   }

   if (includePositions) {
      const startLine = lines[startIndex];
      const endLine = lines[i - 1];
      if (startLine && endLine) {
         node.position = createPosition(startLine, endLine);
      }
   }

   return { block: node, consumed: i - startIndex };
}

/**
 * Parses a single list item.
 */
function parseListItem(
   lines: LineInfo[],
   startIndex: number,
   itemIndent: number,
   marker: "-" | "*" | "+" | ")" | ".",
   context: BlockContext,
   includePositions: boolean,
   depth: number,
): { item: ListItemNode; consumed: number } {
   const itemLines: string[] = [];
   let i = startIndex;
   let hasBlank = false;
   let spread = false;

   // Get first line content (after marker)
   const firstLine = lines[startIndex];
   if (firstLine) {
      const match =
         ORDERED_LIST_REGEX.exec(firstLine.raw.trimStart()) ??
         UNORDERED_LIST_REGEX.exec(firstLine.raw.trimStart());
      if (match) {
         const content = firstLine.raw.trimStart().slice(match[0].length);
         itemLines.push(content);
      }
   }
   i++;

   // Collect continuation lines
   while (i < lines.length) {
      const line = lines[i];
      if (!line) break;

      if (line.isBlank) {
         hasBlank = true;
         itemLines.push("");
         i++;
         continue;
      }

      // Check if this starts a new list item at same level
      const itemMatch = isListItemStart(line.raw);
      if (itemMatch && line.indent < itemIndent) {
         break;
      }

      // Check if this is a continuation
      if (line.indent >= itemIndent) {
         if (hasBlank) {
            spread = true;
         }
         itemLines.push(removeIndent(line.raw, itemIndent));
         i++;
         continue;
      }

      // Check for sub-list or other block starting
      if (itemMatch) {
         break;
      }

      // Lazy continuation for paragraphs
      if (!hasBlank) {
         itemLines.push(line.raw);
         i++;
         continue;
      }

      break;
   }

   // Trim trailing blank lines
   while (itemLines.length > 0 && itemLines[itemLines.length - 1] === "") {
      itemLines.pop();
   }

   // Parse the content within the list item
   const innerContent = itemLines.join("\n");
   const innerContext = {
      ...context,
      listDepth: context.listDepth + 1,
   };
   const { blocks } = parseBlocks(
      innerContent,
      innerContext,
      includePositions,
      depth + 1,
   );

   const node: ListItemNode = {
      type: "listItem",
      children: blocks,
      marker,
      spread,
   };

   if (includePositions) {
      const startLine = lines[startIndex];
      const endLine = lines[i - 1];
      if (startLine && endLine) {
         node.position = createPosition(startLine, endLine);
      }
   }

   return { item: node, consumed: i - startIndex };
}

/**
 * Parses a paragraph (may become setext heading).
 */
function parseParagraph(
   lines: LineInfo[],
   startIndex: number,
   context: BlockContext,
   includePositions: boolean,
): { block: HeadingNode | ParagraphNode; consumed: number } {
   const paragraphLines: string[] = [];
   let i = startIndex;

   while (i < lines.length) {
      const line = lines[i];
      if (!line) break;

      if (line.isBlank) {
         break;
      }

      // Check for setext underline
      if (paragraphLines.length > 0) {
         const setextMatch = isSetextUnderline(line.content);
         if (setextMatch && line.indent < 4) {
            const level = setextMatch[1]?.[0] === "=" ? 1 : 2;
            const text = paragraphLines.join("\n").trim();

            const node: HeadingNode = {
               type: "heading",
               level: level as 1 | 2,
               children: parseInline(text, context.references),
               style: "setext",
            };

            if (includePositions) {
               const startLine = lines[startIndex];
               if (startLine) {
                  node.position = createPosition(startLine, line);
               }
            }

            return { block: node, consumed: i - startIndex + 1 };
         }
      }

      // Check for block-level interrupts
      if (
         isThematicBreak(line.content) ||
         isAtxHeading(line.content) ||
         isFencedCodeStart(line.raw) ||
         (getHtmlBlockType(line.content) > 0 && line.indent < 4) ||
         isBlockquoteStart(line.raw)
      ) {
         break;
      }

      // Check for list item (only certain types can interrupt)
      const listMatch = isListItemStart(line.raw);
      if (listMatch) {
         // Ordered list starting with 1 can interrupt, or unordered
         if (!listMatch.ordered || listMatch.start === 1) {
            break;
         }
      }

      paragraphLines.push(line.content);
      i++;
   }

   if (paragraphLines.length === 0) {
      return { block: null as unknown as ParagraphNode, consumed: 1 };
   }

   const text = paragraphLines.join("\n").trim();
   const node: ParagraphNode = {
      type: "paragraph",
      children: parseInline(text, context.references),
   };

   if (includePositions) {
      const startLine = lines[startIndex];
      const endLine = lines[i - 1] ?? startLine;
      if (startLine && endLine) {
         node.position = createPosition(startLine, endLine);
      }
   }

   return { block: node, consumed: i - startIndex };
}
