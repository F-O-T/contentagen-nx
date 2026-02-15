import { createTool } from "@mastra/core/tools";
import { z } from "zod";

const ImproveReadabilityInputSchema = z.object({
   content: z.string().describe("Content to improve readability"),
   targetFleschScore: z
      .number()
      .default(60)
      .describe("Target Flesch reading ease score"),
   language: z
      .enum(["pt", "en"])
      .default("pt")
      .describe("Content language for word simplifications"),
});

const ImproveReadabilityOutputSchema = z.object({
   success: z.boolean(),
   modifiedContent: z.string(),
   originalScore: z.number(),
   improvedScore: z.number(),
   changesApplied: z.array(z.string()),
   stats: z.object({
      sentencesSplit: z.number(),
      wordsSimplified: z.number(),
      paragraphsSplit: z.number(),
   }),
});

// Word simplifications by language
const simplifications: Record<string, Record<string, string>> = {
   pt: {
      fundamentalmente: "de forma básica",
      consequentemente: "por isso",
      subsequentemente: "depois",
      adicionalmente: "além disso",
      especificamente: "em especial",
      majoritariamente: "na maioria",
      simultaneamente: "ao mesmo tempo",
      indubitavelmente: "sem dúvida",
      imprescindivelmente: "sem falta",
      primordialmente: "principalmente",
      substancialmente: "muito",
      eventualmente: "às vezes",
      precipuamente: "principalmente",
      inexoravelmente: "sem parar",
      intrinsecamente: "naturalmente",
   },
   en: {
      fundamentally: "basically",
      consequently: "so",
      subsequently: "then",
      additionally: "also",
      specifically: "in particular",
      predominantly: "mostly",
      simultaneously: "at the same time",
      undoubtedly: "clearly",
      essentially: "really",
      substantially: "a lot",
      approximately: "about",
      immediately: "right away",
      previously: "before",
      particularly: "especially",
      significantly: "a lot",
   },
};

// Conjunctions to split on by language
const splitConjunctions: Record<string, RegExp> = {
   pt: /,\s*(e|mas|porém|contudo|entretanto|pois|porque|embora|quando|enquanto)\s/i,
   en: /,\s*(and|but|however|therefore|because|although|when|while|since)\s/i,
};

/**
 * Calculate a simplified Flesch reading ease score
 * Higher score = easier to read (60-70 is standard, 80+ is easy)
 */
function calculateFleschScore(content: string): number {
   const words = content.split(/\s+/).filter(Boolean);
   const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 0);
   const syllables = words.reduce(
      (count, word) => count + countSyllables(word),
      0,
   );

   if (words.length === 0 || sentences.length === 0) return 0;

   const avgWordsPerSentence = words.length / sentences.length;
   const avgSyllablesPerWord = syllables / words.length;

   // Flesch Reading Ease formula
   return Math.round(
      206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord,
   );
}

/**
 * Simple syllable counter (approximation)
 */
function countSyllables(word: string): number {
   const cleaned = word.toLowerCase().replace(/[^a-záàâãéèêíìîóòôõúùû]/gi, "");
   if (cleaned.length <= 3) return 1;

   // Count vowel groups as syllables
   const vowels = cleaned.match(/[aeiouáàâãéèêíìîóòôõúùû]+/gi);
   return vowels ? Math.max(1, vowels.length) : 1;
}

export const improveReadabilityTool = createTool({
   id: "improveReadability",
   description:
      "Automatically improve content readability by simplifying sentences, breaking long paragraphs, and replacing complex words",
   inputSchema: ImproveReadabilityInputSchema,
   outputSchema: ImproveReadabilityOutputSchema,
   execute: async (input) => {
      let content = input.content;
      const lang = input.language;
      const changes: string[] = [];
      const stats = {
         sentencesSplit: 0,
         wordsSimplified: 0,
         paragraphsSplit: 0,
      };

      const originalScore = calculateFleschScore(content);

      // 1. Break long sentences (20+ words)
      const sentences = content.match(/[^.!?]+[.!?]+/g) || [];
      const defaultSplitPattern =
         /,\s*(e|mas|porém|contudo|entretanto|pois|porque|embora|quando|enquanto)\s/i;
      for (const sentence of sentences) {
         const wordCount = sentence.split(/\s+/).length;
         if (wordCount > 20) {
            const splitPattern = splitConjunctions[lang] ?? defaultSplitPattern;
            const splitPoint = sentence.match(splitPattern);
            if (splitPoint && splitPoint.index !== undefined) {
               const firstPart = sentence.slice(0, splitPoint.index + 1);
               const secondPart = sentence.slice(
                  splitPoint.index + splitPoint[0].length,
               );
               const newSentence = `${firstPart.trim()} ${secondPart.charAt(0).toUpperCase()}${secondPart.slice(1)}`;
               content = content.replace(sentence, newSentence);
               changes.push(`Split sentence: "${sentence.slice(0, 50)}..."`);
               stats.sentencesSplit++;
            }
         }
      }

      // 2. Replace complex words with simpler alternatives
      const langSimplifications =
         simplifications[lang] ?? simplifications.pt ?? {};
      for (const [complex, simple] of Object.entries(langSimplifications)) {
         const regex = new RegExp(complex, "gi");
         if (regex.test(content)) {
            content = content.replace(regex, simple);
            changes.push(`Simplified: "${complex}" → "${simple}"`);
            stats.wordsSimplified++;
         }
      }

      // 3. Break long paragraphs (100+ words) into smaller ones
      const paragraphs = content.split(/\n\n/);
      const improvedParagraphs = paragraphs.map((para) => {
         const wordCount = para.split(/\s+/).length;
         if (wordCount > 100 && !para.startsWith("#")) {
            // Find middle sentence to break at
            const paraSentences = para.match(/[^.!?]+[.!?]+/g) || [];
            if (paraSentences.length >= 2) {
               const midPoint = Math.floor(paraSentences.length / 2);
               const firstHalf = paraSentences.slice(0, midPoint).join(" ");
               const secondHalf = paraSentences.slice(midPoint).join(" ");
               changes.push(
                  `Split paragraph: "${para.slice(0, 40)}..." (${wordCount} words)`,
               );
               stats.paragraphsSplit++;
               return `${firstHalf.trim()}\n\n${secondHalf.trim()}`;
            }
         }
         return para;
      });
      content = improvedParagraphs.join("\n\n");

      const improvedScore = calculateFleschScore(content);

      return {
         success: changes.length > 0,
         modifiedContent: content,
         originalScore,
         improvedScore,
         changesApplied: changes,
         stats,
      };
   },
});
