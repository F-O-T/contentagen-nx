import { createTool } from "@mastra/core/tools";
import { z } from "zod";

const AlarmistPatternSchema = z.object({
   text: z.string(),
   location: z.string(),
   severity: z.enum(["high", "medium", "low"]),
   suggestion: z.string(),
});

const ManipulativePatternSchema = z.object({
   text: z.string(),
   type: z.enum(["urgency", "fear", "scarcity", "social_proof_abuse"]),
   suggestion: z.string(),
});

const ToneAnalysisInputSchema = z.object({
   content: z.string().describe("Full content"),
   targetTone: z
      .enum(["professional", "casual", "educational", "persuasive"])
      .optional()
      .default("educational")
      .describe("Target tone for the content"),
});

const ToneAnalysisOutputSchema = z.object({
   overallTone: z.string(),
   score: z.number().min(0).max(100),
   alarmistPatterns: z.array(AlarmistPatternSchema),
   manipulativePatterns: z.array(ManipulativePatternSchema),
   clickbaitIndicators: z.array(z.string()),
   issues: z.array(z.string()),
   recommendations: z.array(z.string()),
});

// Alarmist patterns with severity
const ALARMIST_PATTERNS: Array<{
   pattern: RegExp;
   severity: "high" | "medium" | "low";
   suggestion: string;
}> = [
   // High severity - absolute statements
   {
      pattern: /desaparecer\s+completamente/gi,
      severity: "high",
      suggestion: "Use more moderate language like 'may reduce visibility'",
   },
   {
      pattern: /completamente\s+(?:invisível|ignorado|esquecido)/gi,
      severity: "high",
      suggestion: "Avoid absolute statements without evidence",
   },
   {
      pattern: /você\s+(?:vai|irá)\s+(?:perder|fracassar|falhar)/gi,
      severity: "high",
      suggestion: "Replace with conditional language 'may face challenges'",
   },
   {
      pattern: /morte\s+(?:do|da|de)/gi,
      severity: "high",
      suggestion: "Avoid dramatic metaphors like 'death of X'",
   },

   // Medium severity - urgency without basis
   {
      pattern: /a\s+urgência\s+é\s+real/gi,
      severity: "medium",
      suggestion: "Let readers judge urgency based on facts presented",
   },
   {
      pattern: /você\s+não\s+tem\s+tempo/gi,
      severity: "medium",
      suggestion: "Avoid pressuring readers with artificial urgency",
   },
   {
      pattern: /antes\s+que\s+seja\s+tarde/gi,
      severity: "medium",
      suggestion: "Remove fear-inducing language",
   },
   {
      pattern: /último\s+(?:aviso|chance|oportunidade)/gi,
      severity: "medium",
      suggestion: "Avoid scarcity tactics unless genuinely applicable",
   },

   // Low severity - mild exaggeration
   {
      pattern: /revolucion(?:ar|ário|ou)/gi,
      severity: "low",
      suggestion: "Consider more specific descriptions of change",
   },
   {
      pattern:
         /(?:absolutamente|completamente|totalmente)\s+(?:essencial|crítico|necessário)/gi,
      severity: "low",
      suggestion: "Remove unnecessary intensifiers",
   },
];

// Manipulative patterns by type
const MANIPULATIVE_PATTERNS: Array<{
   pattern: RegExp;
   type: "urgency" | "fear" | "scarcity" | "social_proof_abuse";
   suggestion: string;
}> = [
   // Urgency
   {
      pattern: /(?:agora|imediatamente|já)\s+(?:mesmo|!)/gi,
      type: "urgency",
      suggestion: "Remove artificial urgency markers",
   },
   {
      pattern: /comece\s+(?:agora|hoje|já)/gi,
      type: "urgency",
      suggestion: "Allow readers to decide their own timeline",
   },
   {
      pattern: /não\s+(?:perca|espere|deixe)/gi,
      type: "urgency",
      suggestion: "Present information without pressure",
   },

   // Fear
   {
      pattern: /(?:perder|ficar\s+para\s+trás|ser\s+deixado)/gi,
      type: "fear",
      suggestion: "Focus on benefits rather than fear of missing out",
   },
   {
      pattern: /se\s+você\s+não.*(?:vai|irá)/gi,
      type: "fear",
      suggestion: "Reframe threats as positive recommendations",
   },
   {
      pattern: /enquanto\s+(?:você|seus\s+concorrentes)/gi,
      type: "fear",
      suggestion: "Avoid competitive fear tactics",
   },

   // Scarcity
   {
      pattern: /(?:poucos|raros|exclusivo)\s+(?:sabem|conhecem)/gi,
      type: "scarcity",
      suggestion: "Avoid artificial scarcity of knowledge",
   },
   {
      pattern: /segredo\s+(?:que|dos?|das?)/gi,
      type: "scarcity",
      suggestion: "Present information openly without 'secret' framing",
   },

   // Social proof abuse
   {
      pattern: /todo\s+(?:mundo|profissional|especialista)/gi,
      type: "social_proof_abuse",
      suggestion: "Be specific about who and cite sources",
   },
   {
      pattern: /(?:todos|ninguém)\s+(?:sabe|acredita|concorda)/gi,
      type: "social_proof_abuse",
      suggestion: "Avoid universal claims without evidence",
   },
];

// Clickbait indicators
const CLICKBAIT_PATTERNS = [
   {
      pattern: /a\s+verdade\s+(?:chocante|sobre)/gi,
      text: "Sensationalist 'truth' claim",
   },
   {
      pattern: /o\s+que\s+ninguém\s+te\s+conta/gi,
      text: "False exclusivity claim",
   },
   { pattern: /você\s+não\s+vai\s+acreditar/gi, text: "Disbelief bait" },
   {
      pattern: /(?:\d+)\s+(?:coisas|razões|segredos)\s+que/gi,
      text: "Listicle clickbait format",
   },
   {
      pattern: /isso\s+vai\s+(?:mudar|transformar)/gi,
      text: "Transformation promise",
   },
   {
      pattern: /(?:surpreendente|incrível|chocante)/gi,
      text: "Sensationalist adjective",
   },
   {
      pattern: /(?:definitivo|ultimate|completo)\s+guia/gi,
      text: "Superlative title",
   },
];

function findPatternLocations(content: string, pattern: RegExp): string[] {
   const lines = content.split("\n");
   const locations: string[] = [];

   for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? "";
      if (pattern.test(line)) {
         // Reset regex lastIndex for global patterns
         pattern.lastIndex = 0;
         const lineNum = i + 1;
         const preview = line.trim().slice(0, 50);
         locations.push(`Line ${lineNum}: "${preview}..."`);
      }
   }

   return locations;
}

function assessOverallTone(
   alarmistCount: number,
   manipulativeCount: number,
   clickbaitCount: number,
   contentLength: number,
): string {
   const totalIssues = alarmistCount + manipulativeCount + clickbaitCount;
   const issueRatio = totalIssues / (contentLength / 1000); // per 1000 chars

   if (issueRatio < 0.5) return "Balanced and informative";
   if (issueRatio < 1) return "Mostly balanced with some persuasive elements";
   if (issueRatio < 2) return "Persuasive with some alarmist tendencies";
   if (issueRatio < 3) return "Aggressive marketing tone";
   return "Highly manipulative - needs significant revision";
}

export const toneAnalysisTool = createTool({
   id: "toneAnalysis",
   description:
      "Analyze content for alarmist, manipulative, or clickbait language patterns.",
   inputSchema: ToneAnalysisInputSchema,
   outputSchema: ToneAnalysisOutputSchema,
   execute: async (input) => {
      const { content, targetTone } = input;

      const issues: string[] = [];
      const recommendations: string[] = [];
      let score = 100;

      const alarmistPatterns: z.infer<
         typeof ToneAnalysisOutputSchema
      >["alarmistPatterns"] = [];
      const manipulativePatterns: z.infer<
         typeof ToneAnalysisOutputSchema
      >["manipulativePatterns"] = [];
      const clickbaitIndicators: string[] = [];

      // Check alarmist patterns
      for (const { pattern, severity, suggestion } of ALARMIST_PATTERNS) {
         const matches = content.match(pattern);
         if (matches) {
            const locations = findPatternLocations(content, pattern);
            for (const match of matches) {
               alarmistPatterns.push({
                  text: match,
                  location: locations[0] || "Found in content",
                  severity,
                  suggestion,
               });
            }

            // Score penalty based on severity
            const penalty =
               severity === "high" ? 15 : severity === "medium" ? 10 : 5;
            score -= penalty * matches.length;
         }
      }

      // Check manipulative patterns
      for (const { pattern, type, suggestion } of MANIPULATIVE_PATTERNS) {
         const matches = content.match(pattern);
         if (matches) {
            for (const match of matches) {
               manipulativePatterns.push({
                  text: match,
                  type,
                  suggestion,
               });
            }
            score -= 8 * matches.length;
         }
      }

      // Check clickbait patterns
      for (const { pattern, text } of CLICKBAIT_PATTERNS) {
         if (pattern.test(content)) {
            clickbaitIndicators.push(text);
            score -= 5;
         }
      }

      // Generate issues and recommendations
      if (alarmistPatterns.length > 0) {
         const highSeverity = alarmistPatterns.filter(
            (p) => p.severity === "high",
         );
         if (highSeverity.length > 0) {
            issues.push(
               `${highSeverity.length} high-severity alarmist phrase(s) detected`,
            );
         }
         issues.push(
            `${alarmistPatterns.length} total alarmist pattern(s) found`,
         );
         recommendations.push(
            "Replace alarmist language with balanced, evidence-based statements",
         );
      }

      if (manipulativePatterns.length > 0) {
         const types = [...new Set(manipulativePatterns.map((p) => p.type))];
         issues.push(`Manipulative language detected: ${types.join(", ")}`);
         recommendations.push(
            "Remove artificial urgency and fear-based messaging",
         );
      }

      if (clickbaitIndicators.length > 0) {
         issues.push(
            `${clickbaitIndicators.length} clickbait indicator(s) found`,
         );
         recommendations.push(
            "Use specific, honest headlines instead of sensationalist hooks",
         );
      }

      // Target tone specific checks
      if (targetTone === "educational" && manipulativePatterns.length > 2) {
         issues.push(
            "Content has more persuasive elements than expected for educational tone",
         );
         recommendations.push("Focus on informing rather than persuading");
      }

      const overallTone = assessOverallTone(
         alarmistPatterns.length,
         manipulativePatterns.length,
         clickbaitIndicators.length,
         content.length,
      );

      // Bonus for clean content
      if (alarmistPatterns.length === 0 && manipulativePatterns.length === 0) {
         score = Math.min(100, score + 10);
      }

      return {
         overallTone,
         score: Math.max(0, score),
         alarmistPatterns,
         manipulativePatterns,
         clickbaitIndicators,
         issues,
         recommendations,
      };
   },
});
