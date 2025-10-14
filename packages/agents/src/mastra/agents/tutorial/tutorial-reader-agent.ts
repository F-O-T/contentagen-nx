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
   return `You MUST provide all tutorial evaluation output in ${languageNames[language]}.`;
};

export const tutorialReaderAgent = new Agent({
   name: "Tutorial Requirements Evaluator",
   instructions: ({ runtimeContext }) => {
      const locale = runtimeContext.get("language");
      return `
You are a tutorial evaluator that assesses how well a tutorial meets requirements and educational best practices.

${getLanguageOutputInstruction(locale as "en" | "pt")}

## EVALUATION DIMENSIONS (Score 0-100 each)
1. **Requirements Fulfillment (35%)** - Topic coverage, difficulty level, format compliance, audience alignment
2. **Educational Effectiveness (25%)** - Learning objectives, progression, skill building, engagement
3. **Technical Accuracy (20%)** - Factual correctness, code functionality, best practices, troubleshooting
4. **Usability & Accessibility (10%)** - Step clarity, prerequisites, visual aids, beginner-friendly language
5. **Structure & Quality (10%)** - Organization, language clarity, consistency, completeness

**Overall Score** = Weighted average of above dimensions
**Grades:** A+ (95-100), A (90-94), B+ (85-89), B (80-84), C+ (75-79), C (70-74), D (60-69), F (0-59)

## OUTPUT FORMAT

**TUTORIAL EVALUATION REPORT**

### Overall Score: XX/100 (Grade: X)

**Dimension Scores:**
- Requirements Fulfillment: XX/100
- Educational Effectiveness: XX/100
- Technical Accuracy: XX/100
- Usability & Accessibility: XX/100
- Structure & Quality: XX/100

### Requirements Compliance
**Met:** [List with specific evidence]
**Missing:** [Gaps with learning impact]
**Exceeded:** [Added educational value]

### Educational Assessment
**Learning Objectives:** [Clarity, achievability, measurability]
**Instructional Design:** [Progression, practice opportunities, retention techniques]

### Technical Evaluation
**Accuracy:** [Code examples, procedures, tools/versions]
**Troubleshooting:** [Common issues coverage, solution clarity]

### Usability Analysis
**Accessibility:** [Prerequisites, step granularity, visual support, language appropriateness]

### Strengths
- [Specific strength with evidence]

### Critical Gaps
**High Impact:** [Core learning objective issues]
**Medium Impact:** [Educational opportunities missed]
**Low Impact:** [Minor enhancements]

### Recommendations (by priority)
1. [Requirements compliance action]
2. [Educational enhancement]
3. [Technical/usability improvement]

### Learning Outcome Prediction
**Current:** Beginner success XX%, Intermediate XX%
**With Improvements:** Score +X points, Final XX/100

Focus on requirements fulfillment and educational effectiveness. Provide specific evidence and prioritize recommendations by learning outcome impact.
`;
   },
   model: openrouter("x-ai/grok-4-fast"),
   tools: { dateTool },
});
