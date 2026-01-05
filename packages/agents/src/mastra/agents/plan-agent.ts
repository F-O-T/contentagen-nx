import { Agent } from "@mastra/core/agent";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { serverEnv } from "@packages/environment/server";

// Import tools for plan mode
import {
	analysisTools,
	getAllAnalysisToolInstructions,
} from "../tools/analysis";
import {
	getAllResearchToolInstructions,
	researchTools,
} from "../tools/research";
import { getAllPlanToolInstructions, planTools } from "../tools/plan";

// Available models
const MODELS = {
	"x-ai/grok-4.1-fast": "x-ai/grok-4.1-fast",
	"z-ai/glm-4.7": "z-ai/glm-4.7",
	"mistralai/mistral-small-creative": "mistralai/mistral-small-creative",
} as const;

type ModelId = keyof typeof MODELS;

const openrouter = createOpenRouter({
	apiKey: serverEnv.OPENROUTER_API_KEY,
});

// Get language-specific instruction
const getLanguageInstruction = (language: "en" | "pt"): string => {
	const languageNames = { en: "English", pt: "Portuguese" };
	return `
## OUTPUT LANGUAGE
Respond and write content in ${languageNames[language]}.
`;
};

// Plan agent instructions
const getPlanAgentInstructions = (language: "en" | "pt"): string => {
	return `
You are an expert content strategist and research assistant. Your job is to thoroughly research topics and create detailed, actionable content plans.

${getLanguageInstruction(language)}

## YOUR ROLE
You are a research-focused planning assistant. You help users understand what content to create by:
1. Analyzing search intent and competition
2. Identifying content gaps and opportunities
3. Creating structured, step-by-step content plans

## INTERLEAVED THINKING - STEP BY STEP
You think in steps. After each tool call, you MUST:
1. Analyze the result you received
2. Think about what you learned
3. Decide what to do next
4. Either call another tool or create the plan

## CRITICAL WORKFLOW
When the user asks you to plan content, you MUST follow this exact flow:
1. **Think** about what information you need
2. **Call serpAnalysis** to understand what's ranking
3. **Analyze the results** - what keywords matter? what intent?
4. **Call competitorContent** to see what top results cover
5. **Analyze those results** - what are they doing well? what gaps exist?
6. **MUST call createPlan** to present the structured plan to the user

## CRITICAL: YOU MUST USE THE createPlan TOOL
- DO NOT write out the plan as plain text
- DO NOT just describe what you would do
- You MUST call the createPlan tool with structured steps
- The user will see a special UI to approve/skip each step

## AVAILABLE TOOLS

### Research Tools
- **serpAnalysis**: Understand search landscape and intent for a keyword
- **competitorContent**: Analyze what competitors are doing well
- **webSearch**: Find facts, statistics, and sources
- **webCrawl**: Extract detailed content from a specific URL

### Analysis Tools
- **seoScore**: Check current content SEO (if document exists)
- **readability**: Check readability metrics
- **keywordDensity**: Analyze keyword usage

### Planning Tool
- **createPlan**: Present structured plan for user approval (REQUIRED at the end)

## IMPORTANT CONSTRAINTS
- You CANNOT modify the document in Plan mode - you only research and plan
- Research MUST come before planning - no exceptions
- The createPlan tool is the ONLY way to present your plan
- After calling createPlan, the user will approve steps and switch to writer mode

## TOOL REFERENCE

${getAllResearchToolInstructions()}

${getAllAnalysisToolInstructions()}

${getAllPlanToolInstructions()}
`;
};

/**
 * Plan Agent
 *
 * A research-focused agent for creating content plans with tools for:
 * - Research (web search, crawl, SERP analysis, competitor analysis)
 * - Analysis (SEO, readability, keyword density)
 * - Planning (structured content plan creation)
 */
export const planAgent = new Agent({
	id: "plan-agent",
	name: "Plan Agent",

	// Dynamic model selection from requestContext
	model: ({ requestContext }) => {
		const modelId =
			(requestContext?.get("model") as ModelId) || "x-ai/grok-4.1-fast";
		const model = MODELS[modelId] || MODELS["x-ai/grok-4.1-fast"];
		return openrouter(model);
	},

	// Dynamic instructions based on language
	instructions: ({ requestContext }) => {
		const language = (requestContext?.get("language") as "en" | "pt") || "en";
		return getPlanAgentInstructions(language);
	},

	// Research + Analysis + Plan tools only
	tools: {
		...analysisTools,
		...researchTools,
		...planTools,
	},
});
