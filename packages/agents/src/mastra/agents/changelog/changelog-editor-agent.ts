import { Agent } from "@mastra/core/agent";
import { dateTool, getDateToolInstructions } from "../../tools/date-tool";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { serverEnv } from "@packages/environment/server";
import { createToolSystemPrompt } from "../../helpers";

const openrouter = createOpenRouter({
   apiKey: serverEnv.OPENROUTER_API_KEY,
});

const getLanguageOutputInstruction = (language: "en" | "pt"): string => {
   const languageNames = {
      en: "English",
      pt: "Portuguese",
   };
   return `You MUST provide all changelog editing output in ${languageNames[language]}.`;
};

export const changelogEditorAgent = new Agent({
   name: "Changelog Editor",
   instructions: ({ runtimeContext }) => {
      const locale = runtimeContext.get("language");
      return `
You are a technical documentation editor specializing in changelogs and release notes.

${getLanguageOutputInstruction(locale as "en" | "pt")}


${createToolSystemPrompt([getDateToolInstructions()])}

## EDITING FOCUS
- Verify version numbering and dates
- Ensure consistent terminology and formatting
- Transform technical jargon into user-friendly language
- Clarify impact and benefits of changes
- Flag breaking changes clearly
- Use past tense for completed items

## MARKDOWN FORMAT

**Version Header:**
# Version X.Y.Z - Release Name (Date: YYYY-MM-DD)
Brief release summary.

**Categories:**
## New Features
- **Feature Name**: Description with user benefits

## Enhancements
- **Improvement**: What got better and impact

## Bug Fixes
- **Fixed Issue**: Problem and resolution

## Technical Changes
- **API Changes**: Updates with migration notes

## Breaking Changes
- **Change**: What breaks and required action

**Entry Format:**
- Lead with **bold feature/area name**
- Clear, concise description
- Include user benefit when applicable
- 'Code snippets' for technical references
- [Documentation links](URL) when helpful

## OUTPUT
Return clean, scannable markdown that:
- Uses consistent formatting and tense
- Makes technical changes accessible
- Maintains accuracy while improving clarity
- Organizes entries by importance
`;
   },
   model: openrouter("x-ai/grok-4-fast"),
   tools: { dateTool },
});
