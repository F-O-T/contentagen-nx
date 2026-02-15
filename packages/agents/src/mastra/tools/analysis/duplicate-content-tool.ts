import { createTool } from "@mastra/core/tools";
import { z } from "zod";

const DuplicateLocationSchema = z.object({
   startLine: z.number(),
   endLine: z.number(),
});

const DuplicateInfoSchema = z.object({
   text: z.string(),
   occurrences: z.number(),
   locations: z.array(DuplicateLocationSchema),
   type: z.enum(["exact", "near-duplicate"]),
});

const DuplicateContentInputSchema = z.object({
   content: z.string().describe("Full markdown content"),
});

const DuplicateContentOutputSchema = z.object({
   hasDuplicates: z.boolean(),
   duplicates: z.array(DuplicateInfoSchema),
   score: z.number().min(0).max(100),
   issues: z.array(z.string()),
   suggestions: z.array(z.string()),
});

// Minimum paragraph length to consider for duplicate detection
const MIN_PARAGRAPH_LENGTH = 50;
// Similarity threshold for near-duplicates (0-1)
const SIMILARITY_THRESHOLD = 0.8;

interface TextBlock {
   text: string;
   normalized: string;
   startLine: number;
   endLine: number;
   isHeading: boolean;
}

function normalizeText(text: string): string {
   return text
      .toLowerCase()
      .replace(/[^\w\s]/g, "") // Remove punctuation
      .replace(/\s+/g, " ") // Normalize whitespace
      .trim();
}

function calculateSimilarity(str1: string, str2: string): number {
   if (str1 === str2) return 1;
   if (str1.length === 0 || str2.length === 0) return 0;

   // Simple word-based Jaccard similarity
   const words1 = new Set(str1.split(" "));
   const words2 = new Set(str2.split(" "));

   const intersection = new Set([...words1].filter((w) => words2.has(w)));
   const union = new Set([...words1, ...words2]);

   return intersection.size / union.size;
}

function extractBlocks(content: string): TextBlock[] {
   const lines = content.split("\n");
   const blocks: TextBlock[] = [];

   let currentBlock = "";
   let blockStartLine = 0;

   for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line?.trim() ?? "";

      // Check for heading
      if (trimmedLine.startsWith("#")) {
         // Save previous block if exists
         if (currentBlock.trim().length >= MIN_PARAGRAPH_LENGTH) {
            blocks.push({
               text: currentBlock.trim(),
               normalized: normalizeText(currentBlock),
               startLine: blockStartLine + 1, // 1-indexed
               endLine: i, // Previous line
               isHeading: false,
            });
         }

         // Add heading as its own block
         blocks.push({
            text: trimmedLine,
            normalized: normalizeText(trimmedLine.replace(/^#+\s*/, "")),
            startLine: i + 1,
            endLine: i + 1,
            isHeading: true,
         });

         currentBlock = "";
         blockStartLine = i + 1;
      } else if (trimmedLine === "") {
         // Empty line - end of paragraph
         if (currentBlock.trim().length >= MIN_PARAGRAPH_LENGTH) {
            blocks.push({
               text: currentBlock.trim(),
               normalized: normalizeText(currentBlock),
               startLine: blockStartLine + 1,
               endLine: i,
               isHeading: false,
            });
         }
         currentBlock = "";
         blockStartLine = i + 1;
      } else {
         // Continue building block
         currentBlock += " " + trimmedLine;
      }
   }

   // Don't forget the last block
   if (currentBlock.trim().length >= MIN_PARAGRAPH_LENGTH) {
      blocks.push({
         text: currentBlock.trim(),
         normalized: normalizeText(currentBlock),
         startLine: blockStartLine + 1,
         endLine: lines.length,
         isHeading: false,
      });
   }

   return blocks;
}

function findDuplicates(
   blocks: TextBlock[],
): z.infer<typeof DuplicateContentOutputSchema>["duplicates"] {
   const duplicates: z.infer<
      typeof DuplicateContentOutputSchema
   >["duplicates"] = [];
   const processed = new Set<number>();

   for (let i = 0; i < blocks.length; i++) {
      if (processed.has(i)) continue;

      const block = blocks[i];
      if (!block) continue;

      const similarBlocks: Array<{
         index: number;
         type: "exact" | "near-duplicate";
      }> = [];

      for (let j = i + 1; j < blocks.length; j++) {
         if (processed.has(j)) continue;

         const otherBlock = blocks[j];
         if (!otherBlock) continue;

         // Skip comparing headings with paragraphs
         if (block.isHeading !== otherBlock.isHeading) continue;

         const similarity = calculateSimilarity(
            block.normalized,
            otherBlock.normalized,
         );

         if (similarity === 1) {
            similarBlocks.push({ index: j, type: "exact" });
            processed.add(j);
         } else if (similarity >= SIMILARITY_THRESHOLD) {
            similarBlocks.push({ index: j, type: "near-duplicate" });
            processed.add(j);
         }
      }

      if (similarBlocks.length > 0) {
         processed.add(i);

         // Determine overall type (exact if any is exact)
         const hasExact = similarBlocks.some((sb) => sb.type === "exact");

         const locations: Array<{ startLine: number; endLine: number }> = [
            { startLine: block.startLine, endLine: block.endLine },
            ...similarBlocks.map((sb) => {
               const otherBlock = blocks[sb.index];
               return {
                  startLine: otherBlock?.startLine ?? 0,
                  endLine: otherBlock?.endLine ?? 0,
               };
            }),
         ];

         duplicates.push({
            text:
               block.text.length > 100
                  ? `${block.text.slice(0, 100)}...`
                  : block.text,
            occurrences: similarBlocks.length + 1,
            locations,
            type: hasExact ? "exact" : "near-duplicate",
         });
      }
   }

   return duplicates;
}

export const duplicateContentTool = createTool({
   id: "duplicateContent",
   description:
      "Detect duplicate or near-duplicate content sections within the document.",
   inputSchema: DuplicateContentInputSchema,
   outputSchema: DuplicateContentOutputSchema,
   execute: async (input) => {
      const { content } = input;

      const issues: string[] = [];
      const suggestions: string[] = [];
      let score = 100;

      const blocks = extractBlocks(content);
      const duplicates = findDuplicates(blocks);

      const hasDuplicates = duplicates.length > 0;

      if (hasDuplicates) {
         const exactDupes = duplicates.filter((d) => d.type === "exact");
         const nearDupes = duplicates.filter(
            (d) => d.type === "near-duplicate",
         );

         if (exactDupes.length > 0) {
            issues.push(
               `${exactDupes.length} exact duplicate section(s) found (likely copy-paste error)`,
            );
            suggestions.push(
               "Remove duplicate sections - they appear to be copy-paste errors",
            );
            score -= exactDupes.length * 20;
         }

         if (nearDupes.length > 0) {
            issues.push(`${nearDupes.length} near-duplicate section(s) found`);
            suggestions.push(
               "Review similar sections and consolidate or differentiate the content",
            );
            score -= nearDupes.length * 10;
         }

         // Provide specific locations
         for (const dupe of duplicates) {
            const linesInfo = dupe.locations
               .map((loc) =>
                  loc.startLine === loc.endLine
                     ? `line ${loc.startLine}`
                     : `lines ${loc.startLine}-${loc.endLine}`,
               )
               .join(", ");
            suggestions.push(
               `"${dupe.text.slice(0, 50)}..." appears at ${linesInfo}`,
            );
         }
      }

      return {
         hasDuplicates,
         duplicates,
         score: Math.max(0, score),
         issues,
         suggestions,
      };
   },
});
