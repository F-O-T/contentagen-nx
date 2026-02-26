import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import type { InstructionMemoryItem } from "@packages/database/schemas/instruction-memory";
import { DEFAULT_CONTENT_MODEL_ID } from "../../models";
import {
	buildLanguageInstruction,
	compileInstructionMemories,
} from "../../utils";
import { badPatternTool } from "../tools/analysis/bad-pattern-tool";
import { citationTool } from "../tools/analysis/citation-tool";
import { contentStructureTool } from "../tools/analysis/content-structure-tool";
import { duplicateContentTool } from "../tools/analysis/duplicate-content-tool";
import { originalityTool } from "../tools/analysis/originality-tool";
import { readabilityTool } from "../tools/analysis/readability-tool";
import { toneAnalysisTool } from "../tools/analysis/tone-analysis-tool";
import { addEditorCommentTool } from "../tools/editor/add-editor-comment-tool";
import { proposeSuggestionTool } from "../tools/editor/propose-suggestion-tool";
import { replaceTextTool } from "../tools/editor/replace-text-tool";
import { dateTool } from "../tools/date-tool";

const memory = new Memory({
	options: {
		lastMessages: 20,
		generateTitle: {
			model: "openrouter/google/gemini-2.5-flash-lite",
		},
	},
});

const getInstructions = (
	language: string,
	writerInstructions?: InstructionMemoryItem[],
): string => {
	const compiledMemories = compileInstructionMemories(writerInstructions ?? []);
	const languageInstruction = buildLanguageInstruction(language);

	return `
${languageInstruction}

${compiledMemories}

# REVIEWER AGENT

You are an expert content editor and quality reviewer.
Your job: assess content quality and deliver actionable feedback with specific edits.

## REVIEW FRAMEWORK

Run these checks in order:

1. **Structure** — contentStructure: heading hierarchy, section balance
2. **Quality** — citation: claims backed by sources; originality: uniqueness
3. **Tone** — toneAnalysis: consistent voice and style
4. **Readability** — readability: Flesch score and complexity
5. **Patterns** — badPatterns: AI-sounding phrases, clichés, fillers

## APPLY CHANGES DIRECTLY

Don't just report issues — fix them:
- proposeSuggestion — propose a tracked change with rationale
- addEditorComment — add a comment for the author
- replaceText — apply a direct fix inline

## FEEDBACK FORMAT

\`\`\`
# Content Review Report

## Executive Summary
[2-3 sentences overall assessment]

## High Priority
- [Issue]: [Specific fix or suggested edit]

## Medium Priority
- [Issue]: [Specific fix or suggested edit]

## Low Priority
- [Issue]: [Specific fix or suggested edit]

## What Works Well
- [Strength 1]
- [Strength 2]

## Action Plan
1. [Highest-impact fix]
2. [Next fix]
3. [Next fix]
\`\`\`

Respond in the same language as the user request.
`;
};

export const reviewerAgent: Agent = new Agent({
	id: "reviewer-agent",
	name: "Content Reviewer Agent",
	description:
		"Specialized in content quality review, tone analysis, readability assessment, citation validation, originality checking, and structural feedback. Use this agent for: reviewing content quality, checking tone consistency, validating citations, detecting AI-sounding patterns, content feedback.",

	model: ({ requestContext }) => {
		const maybeModel = requestContext?.get("model");
		return typeof maybeModel === "string" && maybeModel.length > 0
			? maybeModel
			: DEFAULT_CONTENT_MODEL_ID;
	},

	instructions: ({ requestContext }) => {
		const writerInstructions = requestContext?.get("writerInstructions") as
			| InstructionMemoryItem[]
			| undefined;
		const language = (requestContext?.get("language") as string) ?? "pt-BR";
		return getInstructions(language, writerInstructions);
	},

	memory,

	tools: {
		contentStructure: contentStructureTool,
		citation: citationTool,
		originality: originalityTool,
		toneAnalysis: toneAnalysisTool,
		readability: readabilityTool,
		badPatterns: badPatternTool,
		duplicateContent: duplicateContentTool,
		addEditorComment: addEditorCommentTool,
		proposeSuggestion: proposeSuggestionTool,
		replaceText: replaceTextTool,
		dateTool: dateTool,
	},
});
