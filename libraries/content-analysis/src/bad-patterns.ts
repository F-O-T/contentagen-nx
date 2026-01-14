/**
 * Bad Pattern Detection Module
 * Detects problematic content patterns that hurt quality and SEO
 */

import type { BadPattern, BadPatternResult } from "./types";
import { extractParagraphs, extractWords, findOccurrences } from "./utils";

/**
 * Analyze content for bad patterns
 */
export function analyzeBadPatterns(
   content: string,
   title?: string,
): BadPatternResult {
   const patterns: BadPattern[] = [];

   // 1. Word count mentions
   const wordCountPattern =
      /\b\d+\+?\s*(?:palavras?|words?)\b|~\s*\d+\s*(?:palavras?|words?)|word\s*count|contagem\s*de\s*palavras/gi;
   const wordCountMatches = findOccurrences(wordCountPattern, content);
   if (wordCountMatches.length > 0) {
      patterns.push({
         pattern: "word_count_mention",
         severity: "warning",
         locations: wordCountMatches,
         suggestion:
            "Remove word count mentions. Readers don't care about article length.",
      });
   }

   // Also check title for word count
   if (title) {
      wordCountPattern.lastIndex = 0;
      const titleWordCountMatch = wordCountPattern.exec(title);
      if (titleWordCountMatch) {
         patterns.push({
            pattern: "word_count_in_title",
            severity: "warning",
            locations: [`Title: "${title}"`],
            suggestion:
               "Remove word count claims from title. Focus on value, not length.",
         });
      }
   }

   // 2. Meta-commentary
   const metaCommentaryPatterns = [
      /\b(?:neste\s+artigo|in\s+this\s+(?:article|post|guide))\b/gi,
      /\b(?:como\s+mencionado|as\s+(?:mentioned|discussed|noted)\s+(?:above|earlier|before))\b/gi,
      /\b(?:vamos\s+explorar|let'?s\s+explore|we\s+will\s+(?:discuss|explore|cover))\b/gi,
      /\b(?:conforme\s+vimos|as\s+we\s+(?:saw|discussed|covered))\b/gi,
   ];

   for (const pattern of metaCommentaryPatterns) {
      const matches = findOccurrences(pattern, content);
      if (matches.length > 0) {
         patterns.push({
            pattern: "meta_commentary",
            severity: "warning",
            locations: matches,
            suggestion:
               "Remove meta-commentary. Just deliver the information directly.",
         });
      }
   }

   // 3. Engagement begging
   const engagementPatterns = [
      /\b(?:não\s+esqueça\s+de|don'?t\s+forget\s+to)\s+(?:curtir|like|subscribe|seguir|compartilhar|share)/gi,
      /\b(?:deixe\s+(?:um\s+)?comentário|leave\s+a\s+comment|comment\s+below)/gi,
      /\b(?:inscreva-se|subscribe|sign\s+up)\s+(?:para|to|for)\s+(?:nossa|my|our|the)\s+(?:newsletter|canal|channel)/gi,
      /\b(?:compartilhe\s+com|share\s+(?:this|with))\s+(?:seus\s+amigos|your\s+friends)/gi,
      /\bsmash\s+(?:that\s+)?(?:like|subscribe)\s+button\b/gi,
   ];

   for (const pattern of engagementPatterns) {
      const matches = findOccurrences(pattern, content);
      if (matches.length > 0) {
         patterns.push({
            pattern: "engagement_begging",
            severity: "warning",
            locations: matches,
            suggestion:
               "Remove engagement begging. Let quality content earn engagement naturally.",
         });
      }
   }

   // 4. Endless introduction check
   const firstH2Index = content.search(/^##\s+/m);
   if (firstH2Index > 0) {
      const introText = content.slice(0, firstH2Index);
      const introWords = extractWords(introText).length;
      if (introWords > 150) {
         patterns.push({
            pattern: "endless_introduction",
            severity: "warning",
            locations: [`Introduction: ~${introWords} words before first H2`],
            suggestion:
               "Shorten introduction to under 150 words. Get to the point faster.",
         });
      }
   }

   // 5. Vague instructions
   const vaguePatterns = [
      /\b(?:configure\s+(?:appropriately|properly|correctly))\b/gi,
      /\b(?:set\s+up\s+(?:as\s+needed|accordingly))\b/gi,
      /\b(?:adjust\s+(?:as\s+necessary|accordingly|as\s+needed))\b/gi,
      /\b(?:use\s+(?:the\s+right|appropriate|suitable)\s+(?:settings|options|values))\b/gi,
   ];

   for (const pattern of vaguePatterns) {
      const matches = findOccurrences(pattern, content);
      if (matches.length > 0) {
         patterns.push({
            pattern: "vague_instructions",
            severity: "warning",
            locations: matches,
            suggestion:
               "Be specific. Instead of 'configure appropriately', say exactly what to configure and how.",
         });
      }
   }

   // 6. Clickbait markers
   const clickbaitPatterns = [
      /\b(?:you\s+won'?t\s+believe|você\s+não\s+vai\s+acreditar)\b/gi,
      /\b(?:this\s+one\s+(?:trick|tip|secret))\b/gi,
      /\b(?:AMAZING|INCREDIBLE|MIND-?BLOWING)\b/g,
      /!!+|\?!+|!{3,}/g,
   ];

   for (const pattern of clickbaitPatterns) {
      const matches = findOccurrences(pattern, content);
      if (matches.length > 0) {
         patterns.push({
            pattern: "clickbait_markers",
            severity: "warning",
            locations: matches,
            suggestion:
               "Remove clickbait language. Use accurate, professional language instead.",
         });
      }
   }

   // 7. Filler phrases
   const fillerPatterns = [
      /\b(?:it\s+goes\s+without\s+saying|vai\s+sem\s+dizer)\b/gi,
      /\b(?:without\s+further\s+ado|sem\s+mais\s+delongas)\b/gi,
      /\b(?:at\s+the\s+end\s+of\s+the\s+day|no\s+final\s+das\s+contas)\b/gi,
      /\b(?:in\s+today'?s\s+(?:digital\s+)?(?:landscape|world|age))\b/gi,
      /\b(?:(?:as\s+)?a\s+matter\s+of\s+fact)\b/gi,
      /\b(?:needless\s+to\s+say|escusado\s+será\s+dizer)\b/gi,
      /\b(?:in\s+(?:conclusion|summary)|em\s+(?:conclusão|resumo))(?:\s*[,:])\b/gi,
   ];

   for (const pattern of fillerPatterns) {
      const matches = findOccurrences(pattern, content);
      if (matches.length > 0) {
         patterns.push({
            pattern: "filler_phrases",
            severity: "warning",
            locations: matches,
            suggestion:
               "Remove filler phrases. They add no value and waste reader's time.",
         });
      }
   }

   // 8. Over-formatting
   const overFormattingPattern =
      /(\*{1,2}[^*]+\*{1,2}\s*){3,}|(_{1,2}[^_]+_{1,2}\s*){3,}/g;
   const overFormattingMatches = findOccurrences(
      overFormattingPattern,
      content,
   );
   if (overFormattingMatches.length > 0) {
      patterns.push({
         pattern: "over_formatting",
         severity: "warning",
         locations: overFormattingMatches,
         suggestion:
            "Reduce consecutive formatting. Use bold/italic sparingly for emphasis.",
      });
   }

   // 9. Wall of text
   const paragraphs = extractParagraphs(content);
   const longParagraphs: string[] = [];
   for (const paragraph of paragraphs) {
      if (paragraph.startsWith("```") || paragraph.startsWith("#")) continue;
      const wordCount = extractWords(paragraph).length;
      if (wordCount > 100) {
         const preview = paragraph.slice(0, 50) + "..." + paragraph.slice(-30);
         longParagraphs.push(`~${wordCount} words: "${preview}"`);
      }
   }
   if (longParagraphs.length > 0) {
      patterns.push({
         pattern: "wall_of_text",
         severity: "warning",
         locations: longParagraphs,
         suggestion:
            "Break up long paragraphs. Keep paragraphs under 100 words for better readability.",
      });
   }

   // 10. Keyword stuffing
   const wordsLower = content.toLowerCase();
   const totalWords = extractWords(content).length;
   const phraseCount: Record<string, number> = {};

   const tokens = wordsLower.match(/\b[a-záàâãéèêíïóôõöúç]{3,}\b/g) || [];
   for (let i = 0; i < tokens.length - 1; i++) {
      const bigram = `${tokens[i]} ${tokens[i + 1]}`;
      phraseCount[bigram] = (phraseCount[bigram] || 0) + 1;
   }

   const stuffedPhrases: string[] = [];
   for (const [phrase, count] of Object.entries(phraseCount)) {
      const density = (count / totalWords) * 100;
      if (density > 3 && count > 5) {
         stuffedPhrases.push(
            `"${phrase}" appears ${count} times (${density.toFixed(1)}% density)`,
         );
      }
   }
   if (stuffedPhrases.length > 0) {
      patterns.push({
         pattern: "keyword_stuffing",
         severity: "warning",
         locations: stuffedPhrases,
         suggestion:
            "Reduce keyword repetition. Use synonyms and natural language variation.",
      });
   }

   return {
      hasIssues: patterns.length > 0,
      issueCount: patterns.length,
      patterns,
   };
}
