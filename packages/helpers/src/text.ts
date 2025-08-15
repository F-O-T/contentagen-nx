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
