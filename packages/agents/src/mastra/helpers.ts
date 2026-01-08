import type { WriterConfig } from "@packages/database/schemas/agent";

export type MastraLLMUsage = {
	inputTokens: number;
	outputTokens: number;
	totalTokens: number;
	reasoningTokens?: number | null;
	cachedInputTokens?: number | null;
};

export function createToolSystemPrompt(toolInstructions: string[]): string {
	if (!toolInstructions.length) {
		return "";
	}

	const formattedInstructions = toolInstructions
		.filter((instruction) => instruction?.trim())
		.map((instruction) => instruction.trim())
		.join("\n");

	return `
# AVAILABLE TOOLS

${formattedInstructions}

# RULES
- Use tools only when necessary
- Never repeat identical calls
- Stop when you have sufficient information
`;
}

/**
 * Formats WriterConfig into human-readable instructions for the agent
 */
export function formatWriterConfig(config: WriterConfig | undefined): string {
	if (!config) return "";

	const sections: string[] = [];

	// === Writing Style ===
	const styleLines: string[] = [];

	if (config.tone) {
		const toneDescriptions: Record<string, string> = {
			formal: "Use formal, professional language",
			conversational: "Write in a friendly, conversational tone",
			professional: "Maintain a professional but approachable tone",
			casual: "Use casual, relaxed language",
			academic: "Use academic, scholarly language with citations",
		};
		styleLines.push(`- **Tone**: ${toneDescriptions[config.tone]}`);
	}

	if (config.voice) {
		const voiceDescriptions: Record<string, string> = {
			first_person: 'Use first person ("I", "we")',
			second_person: 'Address the reader directly ("you", "your")',
			third_person: 'Use third person ("they", "the user")',
		};
		styleLines.push(`- **Voice**: ${voiceDescriptions[config.voice]}`);
	}

	if (config.complexity) {
		const complexityDescriptions: Record<string, string> = {
			simple: "Use simple vocabulary accessible to beginners",
			moderate: "Use moderate vocabulary for general audiences",
			advanced: "Use sophisticated vocabulary for expert readers",
		};
		styleLines.push(
			`- **Vocabulary**: ${complexityDescriptions[config.complexity]}`,
		);
	}

	if (styleLines.length > 0) {
		sections.push(`## WRITING STYLE\n${styleLines.join("\n")}`);
	}

	// === Content Rules ===
	const contentLines: string[] = [];

	if (config.targetWordCount?.min || config.targetWordCount?.max) {
		const min = config.targetWordCount.min || 0;
		const max = config.targetWordCount.max || "unlimited";
		contentLines.push(`- **Target word count**: ${min}-${max} words`);
	}

	if (config.headingStructure?.requireH2Every) {
		contentLines.push(
			`- **Heading frequency**: Use H2 headings every ~${config.headingStructure.requireH2Every} words`,
		);
	}

	if (config.headingStructure?.maxDepth) {
		contentLines.push(
			`- **Max heading depth**: H${config.headingStructure.maxDepth}`,
		);
	}

	if (contentLines.length > 0) {
		sections.push(`## CONTENT RULES\n${contentLines.join("\n")}`);
	}

	// === SEO Rules ===
	const seoLines: string[] = [];

	if (config.seoRules?.maxTitleLength) {
		seoLines.push(
			`- **Title length**: Maximum ${config.seoRules.maxTitleLength} characters`,
		);
	}

	if (config.seoRules?.requireMetaDescription) {
		seoLines.push("- **Meta description**: Required (150-160 characters)");
	}

	if (config.seoRules?.minKeywordDensity || config.seoRules?.maxKeywordDensity) {
		const min = config.seoRules.minKeywordDensity || 0;
		const max = config.seoRules.maxKeywordDensity || "unlimited";
		seoLines.push(`- **Keyword density**: ${min}%-${max}%`);
	}

	if (seoLines.length > 0) {
		sections.push(`## SEO RULES\n${seoLines.join("\n")}`);
	}

	// === Brand Guidelines ===
	if (config.brandTerms && config.brandTerms.length > 0) {
		const brandLines: string[] = [];

		const alwaysUse = config.brandTerms.filter((t) => t.usage === "always_use");
		const neverUse = config.brandTerms.filter((t) => t.usage === "never_use");
		const preferred = config.brandTerms.filter((t) => t.usage === "preferred");

		if (alwaysUse.length > 0) {
			brandLines.push(
				`- **Always use**: ${alwaysUse.map((t) => `"${t.term}"`).join(", ")}`,
			);
		}

		if (neverUse.length > 0) {
			const neverUseFormatted = neverUse
				.map((t) =>
					t.alternative
						? `"${t.term}" (use "${t.alternative}" instead)`
						: `"${t.term}"`,
				)
				.join(", ");
			brandLines.push(`- **Never use**: ${neverUseFormatted}`);
		}

		if (preferred.length > 0) {
			brandLines.push(
				`- **Preferred terms**: ${preferred.map((t) => `"${t.term}"`).join(", ")}`,
			);
		}

		if (brandLines.length > 0) {
			sections.push(`## BRAND GUIDELINES\n${brandLines.join("\n")}`);
		}
	}

	// === Custom Rules (free-form) ===
	if (config.writingGuidelines) {
		sections.push(
			`## WRITING GUIDELINES\n${config.writingGuidelines.trim()}`,
		);
	}

	if (config.audienceProfile) {
		sections.push(`## TARGET AUDIENCE\n${config.audienceProfile.trim()}`);
	}

	if (config.customRules) {
		sections.push(`## CUSTOM RULES\n${config.customRules.trim()}`);
	}

	// === Feature Settings ===
	const featureLines: string[] = [];

	if (config.enableInternalLinking === false) {
		featureLines.push("- Internal linking is DISABLED");
	}

	if (config.ragIntegration === false) {
		featureLines.push("- Content reference (RAG) is DISABLED");
	}

	if (config.enableFactChecking) {
		featureLines.push("- Fact checking is ENABLED - verify claims with sources");
	}

	if (featureLines.length > 0) {
		sections.push(`## FEATURE SETTINGS\n${featureLines.join("\n")}`);
	}

	if (sections.length === 0) {
		return "";
	}

	return `
# WRITER CONFIGURATION
The following rules and preferences have been configured for this agent. Follow them when writing content.

${sections.join("\n\n")}
`;
}