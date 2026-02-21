import { createTool } from "@mastra/core/tools";
import { z } from "zod";

const GenerateQuickAnswerInputSchema = z.object({
   content: z.string().describe("Full content to summarize"),
   primaryKeyword: z.string().describe("Primary keyword to include"),
   answerType: z
      .enum(["tldr", "definition", "keypoints", "comparison"])
      .describe("Type of quick answer to generate"),
   targetLength: z
      .number()
      .optional()
      .default(60)
      .describe("Target word count (default: 50-80)"),
});

const GenerateQuickAnswerOutputSchema = z.object({
   success: z.boolean(),
   quickAnswer: z.string(),
   type: z.string(),
   wordCount: z.number(),
   insertPosition: z.enum(["before_first_heading", "after_intro"]),
});

// Templates for quick answers by type and language
const TEMPLATES = {
   tldr: {
      pt: "> **Resumo Rápido:** {summary}",
      en: "> **TL;DR:** {summary}",
   },
   definition: {
      pt: "**{keyword}** é {definition}. {elaboration}",
      en: "**{keyword}** is {definition}. {elaboration}",
   },
   keypoints: {
      pt: "**Principais pontos sobre {keyword}:**\n\n{points}",
      en: "**Key takeaways about {keyword}:**\n\n{points}",
   },
   comparison: {
      pt: "| Aspecto | Antes | Agora |\n|---------|-------|-------|\n{rows}",
      en: "| Aspect | Before | Now |\n|--------|--------|-----|\n{rows}",
   },
};

function detectLanguage(text: string): "pt" | "en" {
   const ptIndicators = /\b(de|da|do|em|para|que|como|é|são|está|um|uma)\b/i;
   return ptIndicators.test(text) ? "pt" : "en";
}

function extractKeyStatements(
   content: string,
   maxSentences: number = 5,
): string[] {
   // Remove markdown formatting for processing
   const cleanContent = content
      .replace(/^#+\s+.+$/gm, "") // Remove headers
      .replace(/\*\*/g, "") // Remove bold
      .replace(/\*/g, "") // Remove italic
      .replace(/^\s*[-*]\s+/gm, "") // Remove list markers
      .replace(/\[[^\]]+\]\([^)]+\)/g, ""); // Remove links

   // Split into sentences
   const sentences = cleanContent
      .split(/[.!?]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 30 && s.length < 200);

   // Score sentences by importance indicators
   const scored = sentences.map((sentence) => {
      let priority = 0;

      // Has numbers/statistics
      if (/\d+(?:[,.]\d+)?(?:\s*%)?/.test(sentence)) priority += 3;

      // Strong statements
      if (
         /\b(importante|essencial|fundamental|crucial|key|essential|important|must)\b/i.test(
            sentence,
         )
      )
         priority += 2;

      // Transformation/change language
      if (
         /\b(mudou|mudança|transformou|novo|nova|changed|new|transformed)\b/i.test(
            sentence,
         )
      )
         priority += 2;

      // Definition patterns
      if (/\b(é|são|significa|is|are|means)\b/i.test(sentence)) priority += 1;

      // Action-oriented
      if (/\b(precisa|deve|requer|need|should|require|must)\b/i.test(sentence))
         priority += 1;

      return { sentence, priority };
   });

   return scored
      .sort((a, b) => b.priority - a.priority)
      .slice(0, maxSentences)
      .map((s) => s.sentence);
}

function generateTLDR(
   content: string,
   keyword: string,
   targetLength: number,
   language: "pt" | "en",
): string {
   const keyStatements = extractKeyStatements(content, 4);
   const template = TEMPLATES.tldr[language];

   // Build summary from key statements
   let summary = "";
   const wordsUsed = new Set<string>();

   for (const statement of keyStatements) {
      // Clean and shorten
      const shortened =
         statement.length > 80
            ? `${statement.slice(0, statement.lastIndexOf(" ", 80))}...`
            : statement;

      // Avoid repetition
      const words = shortened.toLowerCase().split(/\s+/);
      const newWords = words.filter((w) => !wordsUsed.has(w) && w.length > 3);

      if (newWords.length > 3) {
         summary += (summary ? " " : "") + shortened;
         for (const w of words) {
            wordsUsed.add(w);
         }
      }

      // Check word count
      const currentWordCount = summary.split(/\s+/).length;
      if (currentWordCount >= targetLength) break;
   }

   // Ensure keyword is present
   if (!summary.toLowerCase().includes(keyword.toLowerCase())) {
      const prefix =
         language === "pt"
            ? `${keyword} é fundamental. `
            : `${keyword} is essential. `;
      summary = prefix + summary;
   }

   return template.replace("{summary}", summary.trim());
}

function generateDefinition(
   content: string,
   keyword: string,
   _targetLength: number,
   language: "pt" | "en",
): string {
   const template = TEMPLATES.definition[language];
   const keyStatements = extractKeyStatements(content, 3);

   // Try to find a definition-like statement
   const definitionStatement =
      keyStatements.find((s) =>
         /\b(é|são|significa|is|are|refers to)\b/i.test(s),
      ) ||
      keyStatements[0] ||
      "";

   // Extract definition from statement
   let definition = definitionStatement
      .replace(/^[^:]+:\s*/, "") // Remove prefix before colon
      .replace(/^\w+\s+(?:é|são|is|are)\s+/i, "") // Remove "X is/são"
      .trim();

   if (definition.length > 60) {
      definition = definition.slice(0, definition.lastIndexOf(" ", 60));
   }

   // Get elaboration from second statement
   const elaboration = keyStatements[1] ? keyStatements[1].slice(0, 80) : "";

   return template
      .replace("{keyword}", keyword)
      .replace("{definition}", definition.toLowerCase())
      .replace("{elaboration}", elaboration);
}

function generateKeyPoints(
   content: string,
   keyword: string,
   _targetLength: number,
   language: "pt" | "en",
): string {
   const template = TEMPLATES.keypoints[language];
   const keyStatements = extractKeyStatements(content, 5);

   // Format as bullet points
   const points = keyStatements
      .slice(0, 4)
      .map((statement) => {
         // Shorten if needed
         const shortened =
            statement.length > 60
               ? statement.slice(0, statement.lastIndexOf(" ", 60))
               : statement;
         return `- ${shortened}`;
      })
      .join("\n");

   return template.replace("{keyword}", keyword).replace("{points}", points);
}

function generateComparison(
   _content: string,
   _keyword: string,
   language: "pt" | "en",
): string {
   const template = TEMPLATES.comparison[language];

   // Generate generic comparison rows based on topic
   const rows: string[] = [];
   const aspects =
      language === "pt"
         ? ["Foco principal", "Estratégia", "Resultados esperados"]
         : ["Main focus", "Strategy", "Expected results"];

   // Generate generic comparison rows based on topic
   for (let i = 0; i < 3; i++) {
      const aspect = aspects[i];
      const before =
         language === "pt" ? "Abordagem tradicional" : "Traditional approach";
      const now = language === "pt" ? "Nova abordagem" : "New approach";
      rows.push(`| ${aspect} | ${before} | ${now} |`);
   }

   return template.replace("{rows}", rows.join("\n"));
}

export const generateQuickAnswerTool = createTool({
   id: "generateQuickAnswer",
   description:
      "Generate a TL;DR, definition lead, key points, or comparison table for the content opening.",
   inputSchema: GenerateQuickAnswerInputSchema,
   outputSchema: GenerateQuickAnswerOutputSchema,
   execute: async (input) => {
      const { content, primaryKeyword, answerType, targetLength } = input;

      const language = detectLanguage(content);
      let quickAnswer: string;

      switch (answerType) {
         case "tldr":
            quickAnswer = generateTLDR(
               content,
               primaryKeyword,
               targetLength || 60,
               language,
            );
            break;
         case "definition":
            quickAnswer = generateDefinition(
               content,
               primaryKeyword,
               targetLength || 60,
               language,
            );
            break;
         case "keypoints":
            quickAnswer = generateKeyPoints(
               content,
               primaryKeyword,
               targetLength || 80,
               language,
            );
            break;
         case "comparison":
            quickAnswer = generateComparison(content, primaryKeyword, language);
            break;
         default:
            quickAnswer = generateTLDR(
               content,
               primaryKeyword,
               targetLength || 60,
               language,
            );
      }

      const wordCount = quickAnswer.split(/\s+/).filter(Boolean).length;

      // Determine best insert position
      const insertPosition: "before_first_heading" | "after_intro" =
         answerType === "tldr" || answerType === "definition"
            ? "before_first_heading"
            : "after_intro";

      return {
         success: true,
         quickAnswer,
         type: answerType,
         wordCount,
         insertPosition,
      };
   },
});
