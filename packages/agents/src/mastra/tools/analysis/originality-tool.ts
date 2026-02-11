import { createTool } from "@mastra/core/tools";
import { z } from "zod";

const GenericPatternSchema = z.object({
   text: z.string(),
   type: z.enum(["template_phrase", "filler", "cliche", "common_structure"]),
   suggestion: z.string(),
});

const MissingElementSchema = z.object({
   element: z.string(),
   description: z.string(),
   importance: z.enum(["high", "medium", "low"]),
});

const CompetitiveAnalysisSchema = z.object({
   likelyDifferentiators: z.array(z.string()),
   suggestedAdditions: z.array(z.string()),
});

const OriginalityInputSchema = z.object({
   content: z.string().describe("Full content"),
   topic: z.string().describe("Main topic"),
   contentType: z
      .enum(["how-to", "listicle", "comparison", "explainer", "general"])
      .default("general")
      .describe("Type of content"),
});

const OriginalityOutputSchema = z.object({
   originalityScore: z.number().min(0).max(100),
   genericPatterns: z.array(GenericPatternSchema),
   uniqueElements: z.array(z.string()),
   missingElements: z.array(MissingElementSchema),
   competitiveAnalysis: CompetitiveAnalysisSchema,
   issues: z.array(z.string()),
   recommendations: z.array(z.string()),
});

// Template phrases that indicate generic content
const TEMPLATE_PHRASES = [
   {
      pattern:
         /neste\s+artigo,?\s+(?:vamos|você\s+vai)\s+(?:explorar|descobrir|aprender)/gi,
      suggestion:
         "Start with the key insight or answer instead of announcing what you'll cover",
   },
   {
      pattern:
         /você\s+(?:já\s+)?(?:se\s+perguntou|pensou)\s+(?:sobre|por\s+que)/gi,
      suggestion: "Avoid rhetorical questions as openers - they feel formulaic",
   },
   {
      pattern: /não\s+é\s+(?:segredo|novidade)\s+que/gi,
      suggestion: "If it's not a secret, just state the fact directly",
   },
   {
      pattern: /(?:todos?|todo\s+mundo)\s+(?:sabe|saben|conhece)/gi,
      suggestion: "Avoid universal claims - be specific about your audience",
   },
   {
      pattern: /antes\s+de\s+(?:mais\s+nada|começar|continuar)/gi,
      suggestion: "Get to the point faster - readers are impatient",
   },
   {
      pattern: /sem\s+(?:mais\s+)?(?:delongas|enrolação)/gi,
      suggestion: "Remove meta-commentary about the writing itself",
   },
];

// Filler phrases that add no value
const FILLER_PHRASES = [
   {
      pattern:
         /é\s+importante\s+(?:destacar|ressaltar|mencionar|lembrar)\s+que/gi,
      suggestion: "Remove filler - just state the important thing directly",
   },
   {
      pattern:
         /vale\s+(?:a\s+pena\s+)?(?:ressaltar|destacar|lembrar|mencionar)/gi,
      suggestion: "Cut this filler phrase",
   },
   {
      pattern:
         /como\s+(?:você\s+)?(?:pode|já\s+pode)\s+(?:ver|perceber|notar)/gi,
      suggestion: "Let readers draw their own conclusions",
   },
   {
      pattern:
         /(?:é|isso\s+é)\s+(?:muito|extremamente|bastante)\s+importante/gi,
      suggestion: "Show importance through substance, not claims",
   },
   {
      pattern:
         /como\s+(?:mencionamos?|dissemos?|falamos?)\s+(?:acima|anteriormente)/gi,
      suggestion:
         "Avoid references to earlier content - each section should stand alone",
   },
   {
      pattern: /dito\s+(?:isso|isto|tudo\s+isso)/gi,
      suggestion: "Remove transitional filler",
   },
];

// Topic-specific clichés
const TOPIC_CLICHES: Record<
   string,
   Array<{ pattern: RegExp; suggestion: string }>
> = {
   seo: [
      {
         pattern: /conteúdo\s+é\s+rei/gi,
         suggestion:
            "This cliché is overused - be more specific about what makes content effective",
      },
      {
         pattern: /otimize\s+para\s+o\s+usuário/gi,
         suggestion:
            "Too generic - specify what user optimization means in this context",
      },
      {
         pattern:
            /experiência\s+do\s+usuário\s+é\s+(?:fundamental|essencial)/gi,
         suggestion:
            "Instead of stating it's important, show how to improve it",
      },
      {
         pattern: /o\s+(?:seo|marketing)\s+(?:mudou|evoluiu|não\s+é\s+mais)/gi,
         suggestion: "Avoid stating the obvious - focus on specific changes",
      },
   ],
   marketing: [
      {
         pattern: /engajamento\s+é\s+(?:a\s+)?chave/gi,
         suggestion: "Define what engagement means specifically",
      },
      {
         pattern: /(?:pense|pensar)\s+fora\s+da\s+caixa/gi,
         suggestion: "Avoid business clichés - give concrete examples",
      },
      {
         pattern: /(?:no|neste)\s+(?:mundo|mercado)\s+(?:atual|de\s+hoje)/gi,
         suggestion: "Be specific about the time period or market conditions",
      },
   ],
   technology: [
      {
         pattern:
            /a\s+(?:ia|inteligência\s+artificial)\s+(?:está|vai)\s+(?:revolucionando|transformando)/gi,
         suggestion: "Be specific about what AI is changing and how",
      },
      {
         pattern: /(?:o\s+)?futuro\s+(?:é|será)\s+/gi,
         suggestion: "Speculation is weak - focus on current evidence",
      },
   ],
};

// Elements that indicate original content
const ORIGINALITY_INDICATORS = [
   {
      pattern: /(?:nosso|nossa)\s+(?:teste|pesquisa|análise|experimento)/gi,
      label: "Original research/testing",
   },
   {
      pattern:
         /(?:testamos?|experimentamos?|analisamos?)\s+(?:e\s+)?(?:descobrimos?|encontramos?)/gi,
      label: "First-person experimentation",
   },
   {
      pattern: /(?:em\s+)?minha\s+experiência/gi,
      label: "Personal experience shared",
   },
   {
      pattern: /(?:caso|estudo\s+de\s+caso|case\s+study)/gi,
      label: "Case study included",
   },
   {
      pattern:
         /(?:dados?|números?)\s+(?:internos?|proprietários?|exclusivos?)/gi,
      label: "Proprietary data",
   },
   {
      pattern: /(?:entrevistamos?|conversamos?\s+com)/gi,
      label: "Original interviews",
   },
   {
      pattern:
         /(?:diferente\s+d[ao]|contrário\s+(?:a|ao)|ao\s+contrário\s+d[ao])\s+que/gi,
      label: "Counter-intuitive insight",
   },
   {
      pattern: /(?:surpresa|surpreendente(?:mente)?)\s+(?:foi|é|era)/gi,
      label: "Unexpected finding",
   },
];

// Missing differentiators by content type
const MISSING_DIFFERENTIATORS: Record<
   string,
   Array<{
      element: string;
      description: string;
      importance: "high" | "medium" | "low";
   }>
> = {
   "how-to": [
      {
         element: "Real examples",
         description: "Show actual examples from your experience",
         importance: "high",
      },
      {
         element: "Common mistakes",
         description: "List mistakes you've seen and how to avoid them",
         importance: "medium",
      },
      {
         element: "Time/effort estimate",
         description: "Help readers understand the commitment required",
         importance: "low",
      },
   ],
   listicle: [
      {
         element: "Personal curation criteria",
         description: "Explain why these items made your list",
         importance: "medium",
      },
      {
         element: "Comparison data",
         description: "Compare items with actual metrics",
         importance: "high",
      },
      {
         element: "Unexpected entries",
         description: "Include non-obvious choices with justification",
         importance: "medium",
      },
   ],
   comparison: [
      {
         element: "Hands-on testing",
         description: "Share results from actually using the products/methods",
         importance: "high",
      },
      {
         element: "Specific use cases",
         description: "Explain when each option is best",
         importance: "high",
      },
      {
         element: "Cost analysis",
         description: "Include real cost/benefit analysis",
         importance: "medium",
      },
   ],
   explainer: [
      {
         element: "Analogies",
         description: "Use relatable analogies to explain complex concepts",
         importance: "medium",
      },
      {
         element: "Expert quotes",
         description: "Include verified quotes from named experts",
         importance: "medium",
      },
      {
         element: "Visual explanations",
         description: "Add diagrams or charts to aid understanding",
         importance: "low",
      },
   ],
   general: [
      {
         element: "Original perspective",
         description: "Share a viewpoint that isn't just summarizing others",
         importance: "high",
      },
      {
         element: "Specific examples",
         description: "Use concrete, real-world examples",
         importance: "high",
      },
      {
         element: "Data or evidence",
         description: "Support claims with verifiable data",
         importance: "medium",
      },
   ],
};

function detectTopic(content: string, declaredTopic: string): string {
   const lowerContent = content.toLowerCase();

   // Check for topic keywords
   if (/\b(?:seo|search\s+engine|google|ranking|serp)\b/i.test(lowerContent))
      return "seo";
   if (/\b(?:marketing|campanha|leads|conversão)\b/i.test(lowerContent))
      return "marketing";
   if (
      /\b(?:ia|inteligência\s+artificial|machine\s+learning|ai)\b/i.test(
         lowerContent,
      )
   )
      return "technology";

   return declaredTopic.toLowerCase();
}

export const originalityTool = createTool({
   id: "originality",
   description:
      "Analyze content for originality, detecting generic patterns and suggesting differentiators.",
   inputSchema: OriginalityInputSchema,
   outputSchema: OriginalityOutputSchema,
   execute: async (input) => {
      const { content, topic, contentType } = input;

      const issues: string[] = [];
      const recommendations: string[] = [];
      let score = 100;

      const genericPatterns: z.infer<
         typeof OriginalityOutputSchema
      >["genericPatterns"] = [];
      const uniqueElements: string[] = [];

      // Check template phrases
      for (const { pattern, suggestion } of TEMPLATE_PHRASES) {
         const matches = content.match(pattern);
         if (matches) {
            for (const match of matches) {
               genericPatterns.push({
                  text: match,
                  type: "template_phrase",
                  suggestion,
               });
            }
            score -= matches.length * 5;
         }
      }

      // Check filler phrases
      for (const { pattern, suggestion } of FILLER_PHRASES) {
         const matches = content.match(pattern);
         if (matches) {
            for (const match of matches) {
               genericPatterns.push({
                  text: match,
                  type: "filler",
                  suggestion,
               });
            }
            score -= matches.length * 3;
         }
      }

      // Check topic-specific clichés
      const detectedTopic = detectTopic(content, topic);
      const topicCliches = TOPIC_CLICHES[detectedTopic] || [];
      for (const { pattern, suggestion } of topicCliches) {
         const matches = content.match(pattern);
         if (matches) {
            for (const match of matches) {
               genericPatterns.push({
                  text: match,
                  type: "cliche",
                  suggestion,
               });
            }
            score -= matches.length * 4;
         }
      }

      // Check for originality indicators
      for (const { pattern, label } of ORIGINALITY_INDICATORS) {
         if (pattern.test(content)) {
            uniqueElements.push(label);
            score += 5; // Bonus for original elements
         }
      }

      // Check missing differentiators
      const missingElements: z.infer<
         typeof OriginalityOutputSchema
      >["missingElements"] = [];
      const differentiators =
         MISSING_DIFFERENTIATORS[contentType] ||
         MISSING_DIFFERENTIATORS.general;

      for (const diff of differentiators || []) {
         // Simple heuristic check - could be improved
         const hasElement = uniqueElements.some((ue) =>
            ue.toLowerCase().includes(diff.element.toLowerCase()),
         );
         if (!hasElement) {
            missingElements.push(diff);
            if (diff.importance === "high") score -= 10;
            else if (diff.importance === "medium") score -= 5;
         }
      }

      // Generate issues and recommendations
      if (genericPatterns.length > 0) {
         const templateCount = genericPatterns.filter(
            (p) => p.type === "template_phrase",
         ).length;
         const fillerCount = genericPatterns.filter(
            (p) => p.type === "filler",
         ).length;
         const clicheCount = genericPatterns.filter(
            (p) => p.type === "cliche",
         ).length;

         if (templateCount > 0) {
            issues.push(
               `${templateCount} template phrase(s) make content feel formulaic`,
            );
         }
         if (fillerCount > 0) {
            issues.push(`${fillerCount} filler phrase(s) add no value`);
         }
         if (clicheCount > 0) {
            issues.push(`${clicheCount} topic cliché(s) reduce credibility`);
         }

         recommendations.push(
            "Remove generic phrases and get to the point faster",
         );
      }

      if (uniqueElements.length === 0) {
         issues.push(
            "No originality indicators found - content may feel generic",
         );
         recommendations.push(
            "Add original research, personal experience, or unique insights",
         );
      } else if (uniqueElements.length < 3) {
         recommendations.push(
            `Good start with ${uniqueElements.join(", ")}. Consider adding more original elements.`,
         );
      }

      const highPriorityMissing = missingElements.filter(
         (m) => m.importance === "high",
      );
      if (highPriorityMissing.length > 0) {
         issues.push(
            `Missing key differentiators: ${highPriorityMissing.map((m) => m.element).join(", ")}`,
         );
      }

      // Competitive analysis
      const competitiveAnalysis: z.infer<
         typeof OriginalityOutputSchema
      >["competitiveAnalysis"] = {
         likelyDifferentiators: uniqueElements.slice(0, 5),
         suggestedAdditions: missingElements
            .filter((m) => m.importance !== "low")
            .map((m) => `${m.element}: ${m.description}`)
            .slice(0, 4),
      };

      return {
         originalityScore: Math.min(100, Math.max(0, score)),
         genericPatterns,
         uniqueElements,
         missingElements,
         competitiveAnalysis,
         issues,
         recommendations,
      };
   },
});
