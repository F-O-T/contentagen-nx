import slugfy from "slugify";
export type Diff = [number, string][];
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
