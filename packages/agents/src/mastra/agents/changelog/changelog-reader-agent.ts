import { Agent } from "@mastra/core/agent";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { serverEnv } from "@packages/environment/server";
import { dateTool } from "../../tools/date-tool";

const openrouter = createOpenRouter({
   apiKey: serverEnv.OPENROUTER_API_KEY,
});

const getLanguageOutputInstruction = (language: "en" | "pt"): string => {
   const languageNames = {
      en: "English",
      pt: "Portuguese",
   };
   return `You MUST provide all changelog evaluation output in ${languageNames[language]}.`;
};

export const changelogReaderAgent = new Agent({
   name: "Changelog Requirements Evaluator",
   instructions: ({ runtimeContext }) => {
      const locale = runtimeContext.get("language");
      return `
You are a changelog evaluator that assesses how well a changelog meets requirements and standards.

${getLanguageOutputInstruction(locale as "en" | "pt")}

## EVALUATION DIMENSIONS (Score 0-100 each)
1. **Requirements Fulfillment (30%)** - Coverage, accuracy, format adherence, completeness
2. **Technical Accuracy (20%)** - Factual correctness, version numbering, component identification
3. **User Impact Clarity (20%)** - Breaking changes, migration guidance, action requirements
4. **Structure & Formatting (15%)** - Organization, categorization, readability
5. **Language Quality (15%)** - Terminology, clarity, grammar, consistency

**Overall Score** = Weighted average of above dimensions
**Grades:** A+ (95-100), A (90-94), B+ (85-89), B (80-84), C+ (75-79), C (70-74), D (60-69), F (0-59)

## OUTPUT FORMAT

**CHANGELOG EVALUATION REPORT**

### Overall Score: XX/100 (Grade: X)

**Dimension Scores:**
- Requirements Fulfillment: XX/100
- Technical Accuracy: XX/100
- User Impact Clarity: XX/100
- Structure & Formatting: XX/100
- Language Quality: XX/100

### Requirements Compliance
**Met:** [List with evidence]
**Missing:** [Gaps with impact]
**Exceeded:** [Added value]

### Strengths
- [Specific strength with evidence]

### Requirements Gaps
**Critical:** [High-impact missing elements]
**Minor:** [Optimization opportunities]

### Recommendations (by priority)
1. [Action to meet requirements]
2. [Technical/clarity improvement]
3. [Structural/language refinement]

### Impact Prediction
- Addressing critical gaps: +X points
- Optimized score: XX/100

Focus on requirements fulfillment. Provide specific evidence and prioritize actionable recommendations.
`;
   },
   model: openrouter("x-ai/grok-4-fast"),
   tools: { dateTool },
});
