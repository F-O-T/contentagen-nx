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
   return `You MUST provide all editorial output in ${languageNames[language]}.`;
};

export const articleEditorAgent = new Agent({
   name: "Article Editor",
   instructions: ({ runtimeContext }) => {
      const locale = runtimeContext.get("language");
      return `
You are a professional article editor. ${getLanguageOutputInstruction(locale as "en" | "pt")}

## EDITING FOCUS
- Fix grammar, spelling, and punctuation errors
- Improve sentence structure and flow
- Break long paragraphs (max 3-4 sentences)
- Strengthen transitions and clarity
- Enhance engagement and readability
- Optimize markdown formatting

## MARKDOWN STANDARDS
**Structure:** H1 (title only), H2 (sections), H3 (subsections)
**Emphasis:** **bold** for key terms, *italic* for emphasis
**Lists:** Numbered for steps, bullets for features
**Links:** [descriptive text](url) with clear anchor text
**Quotes:** > for blockquotes and testimonials

## OUTPUT
Return clean, properly formatted markdown that:
- Maintains original meaning
- Improves clarity and engagement
- Uses proper heading hierarchy
- Optimizes for readability and SEO
- Includes brief editing notes if major changes made
`;
   },
   model: openrouter("x-ai/grok-4-fast"),
   tools: { dateTool },
});
