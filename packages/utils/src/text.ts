import slugfy from "slugify";

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

export function calculateContentStats(content: string) {
   const wordCount = countWords(content);
   const readTime = readTimeMinutes(wordCount);

   return {
      wordsCount: wordCount.toString(),
      readTimeMinutes: readTime.toString(),
   };
}
