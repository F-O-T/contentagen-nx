import slugfy from "slugify";
export type Diff = [number, string][];
export type LineDiff = {
   type: "add" | "remove" | "context";
   lineNumber?: number;
   content: string;
}[];

export function createDiff(text1: string, text2: string): Diff {
   if (text1 === text2) {
      return text1 ? [[0, text1]] : [];
   }

   const len1 = text1.length;
   const len2 = text2.length;
   const minLen = len1 < len2 ? len1 : len2;

   let commonPrefixLength = 0;
   while (
      commonPrefixLength < minLen &&
      text1.charCodeAt(commonPrefixLength) ===
         text2.charCodeAt(commonPrefixLength)
   ) {
      commonPrefixLength++;
   }

   if (commonPrefixLength === len1 && commonPrefixLength === len2) {
      return text1 ? [[0, text1]] : [];
   }

   let commonSuffixLength = 0;
   const maxSuffix =
      len1 - commonPrefixLength < len2 - commonPrefixLength
         ? len1 - commonPrefixLength
         : len2 - commonPrefixLength;
   while (
      commonSuffixLength < maxSuffix &&
      text1.charCodeAt(len1 - 1 - commonSuffixLength) ===
         text2.charCodeAt(len2 - 1 - commonSuffixLength)
   ) {
      commonSuffixLength++;
   }

   const diffs: Diff = [];

   if (commonPrefixLength > 0) {
      diffs.push([0, text1.slice(0, commonPrefixLength)]);
   }

   const text1MidStart = commonPrefixLength;
   const text1MidEnd = len1 - commonSuffixLength;
   if (text1MidEnd > text1MidStart) {
      diffs.push([-1, text1.slice(text1MidStart, text1MidEnd)]);
   }

   const text2MidStart = commonPrefixLength;
   const text2MidEnd = len2 - commonSuffixLength;
   if (text2MidEnd > text2MidStart) {
      diffs.push([1, text2.slice(text2MidStart, text2MidEnd)]);
   }

   if (commonSuffixLength > 0) {
      diffs.push([0, text1.slice(len1 - commonSuffixLength)]);
   }

   return diffs;
}

export function createLineDiff(
   text1: string,
   text2: string,
   contextLines: number = 3,
): LineDiff {
   const lines1 = text1.split("\n");
   const lines2 = text2.split("\n");

   const diff: LineDiff = [];

   let i = 0;
   let j = 0;
   let lineNumber = 1;

   while (i < lines1.length || j < lines2.length) {
      // Find the next difference
      let commonStart = -1;
      for (let k = 0; k < Math.min(lines1.length - i, lines2.length - j); k++) {
         const line1 = lines1[i + k];
         const line2 = lines2[j + k];
         if (line1 !== line2) {
            commonStart = k;
            break;
         }
      }

      if (commonStart === -1) {
         // No differences found, add remaining common lines
         const remainingLines = Math.max(lines1.length - i, lines2.length - j);
         for (let k = 0; k < remainingLines; k++) {
            const line = (
               lines1[i + k] !== undefined ? lines1[i + k] : lines2[j + k]
            ) as string;
            diff.push({
               type: "context",
               lineNumber: lineNumber++,
               content: line,
            });
         }
         break;
      }

      // Add context lines before the change
      const contextStart = Math.max(0, i - contextLines);
      for (let k = contextStart; k < i; k++) {
         if (k < lines1.length) {
            const line = lines1[k];
            if (line !== undefined) {
               diff.push({
                  type: "context",
                  lineNumber: lineNumber++,
                  content: line,
               });
            }
         }
      }

      // Find the end of the difference
      let diffEnd = commonStart;
      const maxLookahead = Math.min(
         lines1.length - i - commonStart,
         lines2.length - j - commonStart,
      );

      for (let k = 0; k < maxLookahead; k++) {
         const line1 = lines1[i + commonStart + k];
         const line2 = lines2[j + commonStart + k];
         if (line1 === line2) {
            diffEnd = commonStart + k;
            break;
         }
      }

      // Add removed lines
      for (let k = 0; k < diffEnd; k++) {
         if (i + k < lines1.length) {
            const line = lines1[i + k];
            if (line !== undefined) {
               diff.push({
                  type: "remove",
                  lineNumber: lineNumber++,
                  content: line,
               });
            }
         }
      }

      // Add added lines
      for (let k = 0; k < diffEnd; k++) {
         if (j + k < lines2.length) {
            const line = lines2[j + k];
            if (line !== undefined) {
               diff.push({
                  type: "add",
                  lineNumber: lineNumber++,
                  content: line,
               });
            }
         }
      }

      i += diffEnd;
      j += diffEnd;

      // Add context lines after the change
      const contextEnd = Math.min(lines1.length, i + contextLines);
      for (let k = i; k < contextEnd; k++) {
         if (k < lines1.length && lines1[k] === lines2[j]) {
            const line = lines1[k];
            if (line !== undefined) {
               diff.push({
                  type: "context",
                  lineNumber: lineNumber++,
                  content: line,
               });
            }
            i++;
            j++;
         } else {
            break;
         }
      }
   }

   return diff;
}
export function createSlug(name: string): string {
   return slugfy(name, { lower: true, strict: true });
}
export function countWords(text: string) {
   return text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
}
export function extractTitleFromMarkdown(markdown: string): string {
   const match = markdown.match(/^#\s+(.*)/m);
   return match?.[1]?.trim() ?? "";
}
export function readTimeMinutes(wordCount: number): number {
   const wordsPerMinute = 200; // Average reading speed
   return Math.ceil(wordCount / wordsPerMinute);
}

export function removeTitleFromMarkdown(markdown: string): string {
   return markdown.replace(/^#\s+.*\n?/, "");
}

export function formatValueForDisplay(value: string) {
   if (!value) return "Not specified";
   return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
