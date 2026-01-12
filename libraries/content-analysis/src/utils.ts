/**
 * Shared utility functions for content analysis
 */

/**
 * Count syllables in a word using a simplified vowel group algorithm
 */
export function countSyllables(word: string): number {
   const w = word.toLowerCase();
   if (w.length <= 3) return 1;

   const vowelGroups = w.match(/[aeiouy]+/g) || [];
   let count = vowelGroups.length;

   // Silent 'e' at the end
   if (w.endsWith("e")) count--;

   return Math.max(1, count);
}

/**
 * Calculate Flesch-Kincaid readability metrics
 */
export function calculateFleschKincaid(text: string): {
   readingEase: number;
   gradeLevel: number;
} {
   const cleanText = text.replace(/[^\w\s.!?]/g, "");
   const sentences = cleanText.split(/[.!?]+/).filter(Boolean);
   const words = cleanText.split(/\s+/).filter(Boolean);

   if (words.length === 0 || sentences.length === 0) {
      return { readingEase: 0, gradeLevel: 0 };
   }

   const totalSyllables = words.reduce(
      (sum, word) => sum + countSyllables(word),
      0,
   );
   const avgWordsPerSentence = words.length / sentences.length;
   const avgSyllablesPerWord = totalSyllables / words.length;

   // Flesch Reading Ease formula
   const readingEase =
      206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;

   // Flesch-Kincaid Grade Level formula
   const gradeLevel =
      0.39 * avgWordsPerSentence + 11.8 * avgSyllablesPerWord - 15.59;

   return {
      readingEase: Math.max(
         0,
         Math.min(100, Math.round(readingEase * 10) / 10),
      ),
      gradeLevel: Math.max(0, Math.round(gradeLevel * 10) / 10),
   };
}

/**
 * Convert reading ease score to human-readable level
 */
export function getReadabilityLevel(score: number): string {
   if (score >= 90) return "Very Easy (5th grade)";
   if (score >= 80) return "Easy (6th grade)";
   if (score >= 70) return "Fairly Easy (7th grade)";
   if (score >= 60) return "Standard (8th-9th grade)";
   if (score >= 50) return "Fairly Difficult (10th-12th grade)";
   if (score >= 30) return "Difficult (College)";
   return "Very Difficult (College Graduate)";
}

/**
 * Find all occurrences of a regex pattern with surrounding context
 */
export function findOccurrences(regex: RegExp, text: string): string[] {
   const matches: string[] = [];
   const flags = regex.flags.includes("g") ? regex.flags : `${regex.flags}g`;
   const globalRegex = new RegExp(regex.source, flags);
   let match: RegExpExecArray | null;

   while ((match = globalRegex.exec(text)) !== null) {
      const start = Math.max(0, match.index - 20);
      const end = Math.min(text.length, match.index + match[0].length + 20);
      const context = text.slice(start, end);
      matches.push(`...${context}...`);
   }

   return matches;
}

/**
 * Extract words from content
 */
export function extractWords(content: string): string[] {
   return content.split(/\s+/).filter(Boolean);
}

/**
 * Extract paragraphs from content
 */
export function extractParagraphs(content: string): string[] {
   return content.split(/\n\n+/).filter(Boolean);
}

/**
 * Extract headings from markdown content
 */
export function extractHeadings(
   content: string,
): Array<{ level: number; text: string; index: number }> {
   const headingMatches = [...content.matchAll(/^(#{1,6})\s+(.+)$/gm)];
   const headings: Array<{ level: number; text: string; index: number }> = [];

   for (const match of headingMatches) {
      const hashMarks = match[1];
      const headingText = match[2];
      if (hashMarks && headingText) {
         headings.push({
            level: hashMarks.length,
            text: headingText,
            index: match.index ?? 0,
         });
      }
   }

   return headings;
}

/**
 * Clamp score between 0 and 100
 */
export function clampScore(score: number): number {
   return Math.max(0, Math.min(100, score));
}

/**
 * Check if content has a quick answer pattern in the first portion
 */
export function hasQuickAnswerPattern(text: string): boolean {
   return (
      /\*\*quick\s*answer\*\*|>.*quick.*answer|tl;?dr|em\s+resumo|resumindo/i.test(
         text,
      ) ||
      /^.*?\*\*[^*]+\*\*\s+(?:é|is|are|was|were|significa)\s/im.test(text) ||
      /^\|.*\|.*\|$/m.test(text)
   );
}

/**
 * Check if content has a conclusion section
 */
export function hasConclusionSection(content: string): boolean {
   return /##\s*(?:conclus|conclusion|resumo|takeaway|key\s*takeaway|final|wrapping\s*up)/i.test(
      content,
   );
}
