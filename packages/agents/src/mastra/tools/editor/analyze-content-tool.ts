import { createTool } from "@mastra/core/tools";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function countWords(text: string): number {
	return text.split(/\s+/).filter(Boolean).length;
}

// Fix I1: extracted to module level — shared by calculateFleschKincaid and analyzeReadability
function countSyllables(word: string): number {
	const w = word.toLowerCase();
	if (w.length <= 3) return 1;
	const vowelGroups = w.match(/[aeiouy]+/g) ?? [];
	let count = vowelGroups.length;
	if (w.endsWith("e")) count--;
	return Math.max(1, count);
}

// ---------------------------------------------------------------------------
// SEO aspect (ported from seo-score-tool.ts)
// ---------------------------------------------------------------------------

function analyzeSeo(
	content: string,
	title?: string,
	description?: string,
	keywords?: string[],
): { score: number; issues: string[]; suggestions: string[] } {
	const issues: string[] = [];
	const suggestions: string[] = [];
	let score = 100;

	const wordCount = countWords(content);
	const headings = content.match(/^#{1,6}\s.+$/gm) ?? [];
	const h2Headings = content.match(/^##\s.+$/gm) ?? [];
	const links = content.match(/(?<!!)\[.+?\]\(.+?\)/g) ?? [];
	const images = content.match(/!\[.+?\]\(.+?\)/g) ?? [];

	const firstH2Index = content.search(/^##\s/m);
	const firstParagraphText =
		firstH2Index > 0
			? content.slice(0, firstH2Index)
			: content.split(/\s+/).slice(0, 100).join(" ");

	// Title
	if (!title) {
		issues.push("Missing title");
		suggestions.push("Add a descriptive title (50-60 characters)");
		score -= 15;
	} else if (title.length < 30) {
		issues.push("Title is too short");
		suggestions.push("Expand title to 50-60 characters for better SEO");
		score -= 8;
	} else if (title.length > 60) {
		issues.push("Title is too long");
		suggestions.push(
			"Shorten to under 60 characters to avoid truncation in search results",
		);
		score -= 5;
	}

	if (title && keywords && keywords.length > 0) {
		const titleLower = title.toLowerCase();
		const hasKeywordInTitle = keywords.some((kw) =>
			titleLower.includes(kw.toLowerCase()),
		);
		if (!hasKeywordInTitle) {
			issues.push("Primary keyword not found in title");
			suggestions.push("Include your primary keyword naturally in the title");
			score -= 5;
		}
	}

	// Meta description
	if (!description) {
		issues.push("Missing meta description");
		suggestions.push("Add a meta description (150-160 characters)");
		score -= 10;
	} else if (description.length < 120) {
		issues.push("Meta description could be longer");
		suggestions.push("Expand to 150-160 characters");
		score -= 3;
	} else if (description.length > 160) {
		issues.push("Meta description is too long");
		suggestions.push("Shorten to under 160 characters");
		score -= 5;
	}

	// Headings
	if (headings.length === 0) {
		issues.push("No headings found");
		suggestions.push("Add H2 and H3 headings to structure your content");
		score -= 15;
	} else if (h2Headings.length < 3 && wordCount > 500) {
		issues.push("Too few H2 headings for content length");
		suggestions.push("Add more H2 subheadings (one every 200-300 words)");
		score -= 5;
	}

	const h1Headings = content.match(/^#\s.+$/gm) ?? [];
	if (h1Headings.length > 0) {
		issues.push("H1 heading found in content body");
		suggestions.push(
			"Remove H1 from content. The title is in frontmatter. Start with H2.",
		);
		score -= 10;
	}

	if (keywords && keywords.length > 0 && h2Headings.length > 0) {
		const h2Text = h2Headings.join(" ").toLowerCase();
		const hasKeywordInH2 = keywords.some((kw) =>
			h2Text.includes(kw.toLowerCase()),
		);
		if (!hasKeywordInH2) {
			issues.push("Target keywords not found in any H2 headings");
			suggestions.push(
				"Include keywords naturally in at least one H2 heading",
			);
			score -= 3;
		}
	}

	// Content length
	if (wordCount < 300) {
		issues.push("Content is too short");
		suggestions.push("Aim for at least 600-1000 words for blog posts");
		score -= 10;
	} else if (wordCount < 600) {
		issues.push("Content could be longer");
		suggestions.push("Consider expanding to 1000+ words for better ranking");
		score -= 5;
	}

	// Links
	if (links.length === 0 && wordCount > 500) {
		issues.push("No links found");
		suggestions.push("Add internal and external links to improve SEO");
		score -= 10;
	} else if (links.length < 3 && wordCount > 1000) {
		issues.push("Few links for content length");
		suggestions.push(
			"Add more internal links to related content and external links to authoritative sources",
		);
		score -= 3;
	}

	// Images
	if (images.length === 0 && wordCount > 300) {
		issues.push("No images found");
		suggestions.push("Add images with descriptive alt text");
		score -= 3;
	}

	// Quick answer
	const hasQuickAnswer =
		/\*\*quick\s*answer\*\*|>\s*\*\*.*\*\*|tl;?dr|em\s+resumo/i.test(
			firstParagraphText,
		) ||
		/^\*\*[^*]+\*\*\s+(?:é|is|are|significa)/im.test(firstParagraphText) ||
		/^\|.*\|.*\|$/m.test(firstParagraphText);

	if (!hasQuickAnswer && wordCount > 300) {
		issues.push("No quick answer detected in first 100 words");
		suggestions.push(
			"Add a TL;DR, definition lead, or comparison table early to answer the reader's question immediately",
		);
		score -= 10;
	}

	// Keyword in first paragraph
	if (keywords && keywords.length > 0) {
		const firstParaLower = firstParagraphText.toLowerCase();
		const keywordInFirstParagraph = keywords.some((kw) =>
			firstParaLower.includes(kw.toLowerCase()),
		);
		if (!keywordInFirstParagraph) {
			issues.push("Primary keyword not found in first paragraph");
			suggestions.push(
				"Include your primary keyword in the first 100 words for better SEO",
			);
			score -= 5;
		}
	}

	// Keyword density
	if (keywords && keywords.length > 0) {
		const contentLower = content.toLowerCase();
		for (const keyword of keywords) {
			const regex = new RegExp(keyword.toLowerCase(), "gi");
			const matches = contentLower.match(regex) ?? [];
			const density = Number(((matches.length / wordCount) * 100).toFixed(2));

			if (density === 0) {
				issues.push(`Target keyword "${keyword}" not found`);
				suggestions.push(`Include "${keyword}" naturally in your content`);
				score -= 5;
			} else if (density > 3) {
				issues.push(
					`Keyword "${keyword}" may be overused (${density}% density)`,
				);
				suggestions.push("Reduce keyword density to 1-2%");
				score -= 3;
			}
		}
	}

	// Conclusion
	const hasConclusion =
		/##\s*(?:conclus|conclusion|resumo|takeaway|key\s*takeaway|final)/i.test(
			content,
		);
	if (!hasConclusion && wordCount > 500) {
		issues.push("No conclusion section detected");
		suggestions.push(
			"Add a conclusion with key takeaways and a call-to-action",
		);
		score -= 5;
	}

	return { score: Math.max(0, Math.min(100, score)), issues, suggestions };
}

// ---------------------------------------------------------------------------
// Readability aspect (ported from readability-tool.ts)
// ---------------------------------------------------------------------------

function calculateFleschKincaid(text: string): {
	readingEase: number;
	gradeLevel: number;
	avgWordsPerSentence: number;
	complexWordRatio: number;
	avgSyllablesPerWord: number;
} {
	const cleanText = text.replace(/[^\w\s.!?]/g, "");
	const sentences = cleanText.split(/[.!?]+/).filter(Boolean);
	const words = cleanText.split(/\s+/).filter(Boolean);

	if (words.length === 0 || sentences.length === 0) {
		return { readingEase: 0, gradeLevel: 0, avgWordsPerSentence: 0, complexWordRatio: 0, avgSyllablesPerWord: 0 };
	}

	const totalSyllables = words.reduce(
		(sum, word) => sum + countSyllables(word),
		0,
	);
	const avgWordsPerSentence = words.length / sentences.length;
	const avgSyllablesPerWord = totalSyllables / words.length;
	const complexWordRatio = words.filter((w) => countSyllables(w) >= 3).length / words.length;

	// Fix M1: return raw Flesch score without clamping — analyzeReadability handles bounding
	const readingEase =
		206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;
	const gradeLevel =
		0.39 * avgWordsPerSentence + 11.8 * avgSyllablesPerWord - 15.59;

	return {
		readingEase: Math.round(readingEase * 10) / 10,
		gradeLevel: Math.max(0, Math.round(gradeLevel * 10) / 10),
		avgWordsPerSentence,
		complexWordRatio,
		avgSyllablesPerWord,
	};
}

function analyzeReadability(
	content: string,
): { score: number; issues: string[]; suggestions: string[] } {
	const issues: string[] = [];
	const suggestions: string[] = [];

	// Fix I1: call calculateFleschKincaid once and consume its returned metrics
	const { readingEase, avgWordsPerSentence, complexWordRatio } = calculateFleschKincaid(content);

	// Target general audience (60-70)
	const targetMin = 60;
	const targetMax = 70;

	if (readingEase < targetMin) {
		issues.push(
			`Readability score ${readingEase} is below target range (${targetMin}-${targetMax})`,
		);
		suggestions.push("Simplify your language - use shorter words and sentences");

		if (avgWordsPerSentence > 20) {
			suggestions.push(
				`Average sentence length is ${Math.round(avgWordsPerSentence)} words. Try to keep it under 20.`,
			);
		}

		if (complexWordRatio > 0.2) {
			suggestions.push(
				"Too many complex words (3+ syllables). Replace with simpler alternatives.",
			);
		}

		suggestions.push("Break long sentences into shorter ones");
		suggestions.push("Use active voice instead of passive voice");
	} else if (readingEase > targetMax) {
		issues.push("Content may be too simple for your target audience");
		suggestions.push("Consider adding more technical depth or detail");
	}

	const cleanText = content.replace(/[^\w\s.!?]/g, "");
	const sentences = cleanText.split(/[.!?]+/).filter(Boolean);
	if (sentences.some((s) => s.split(/\s+/).length > 40)) {
		issues.push("Some sentences are very long (40+ words)");
		suggestions.push(
			"Some sentences are very long. Consider breaking them up.",
		);
	}

	// Score: map readingEase to 0-100 based on closeness to target
	let score: number;
	if (readingEase >= targetMin && readingEase <= targetMax) {
		score = 100;
	} else if (readingEase < targetMin) {
		score = Math.max(0, 100 - (targetMin - readingEase) * 2);
	} else {
		score = Math.max(0, 100 - (readingEase - targetMax) * 1.5);
	}

	return { score: Math.round(score), issues, suggestions };
}

// ---------------------------------------------------------------------------
// Tone aspect (ported from tone-analysis-tool.ts)
// ---------------------------------------------------------------------------

const ALARMIST_PATTERNS_DATA: Array<{
	pattern: RegExp;
	severity: "high" | "medium" | "low";
}> = [
	{ pattern: /desaparecer\s+completamente/gi, severity: "high" },
	{
		pattern: /completamente\s+(?:invisível|ignorado|esquecido)/gi,
		severity: "high",
	},
	{
		pattern: /você\s+(?:vai|irá)\s+(?:perder|fracassar|falhar)/gi,
		severity: "high",
	},
	{ pattern: /morte\s+(?:do|da|de)/gi, severity: "high" },
	{ pattern: /a\s+urgência\s+é\s+real/gi, severity: "medium" },
	{ pattern: /você\s+não\s+tem\s+tempo/gi, severity: "medium" },
	{ pattern: /antes\s+que\s+seja\s+tarde/gi, severity: "medium" },
	{
		pattern: /último\s+(?:aviso|chance|oportunidade)/gi,
		severity: "medium",
	},
	{ pattern: /revolucion(?:ar|ário|ou)/gi, severity: "low" },
	{
		pattern:
			/(?:absolutamente|completamente|totalmente)\s+(?:essencial|crítico|necessário)/gi,
		severity: "low",
	},
];

const MANIPULATIVE_PATTERNS_DATA: RegExp[] = [
	/(?:agora|imediatamente|já)\s+(?:mesmo|!)/gi,
	/comece\s+(?:agora|hoje|já)/gi,
	/não\s+(?:perca|espere|deixe)/gi,
	/(?:perder|ficar\s+para\s+trás|ser\s+deixado)/gi,
	/se\s+você\s+não.*(?:vai|irá)/gi,
	/enquanto\s+(?:você|seus\s+concorrentes)/gi,
	/(?:poucos|raros|exclusivo)\s+(?:sabem|conhecem)/gi,
	/segredo\s+(?:que|dos?|das?)/gi,
	/todo\s+(?:mundo|profissional|especialista)/gi,
	/(?:todos|ninguém)\s+(?:sabe|acredita|concorda)/gi,
];

const CLICKBAIT_PATTERNS_DATA: RegExp[] = [
	/a\s+verdade\s+(?:chocante|sobre)/gi,
	/o\s+que\s+ninguém\s+te\s+conta/gi,
	/você\s+não\s+vai\s+acreditar/gi,
	/(?:\d+)\s+(?:coisas|razões|segredos)\s+que/gi,
	/isso\s+vai\s+(?:mudar|transformar)/gi,
	/(?:surpreendente|incrível|chocante)/gi,
	/(?:definitivo|ultimate|completo)\s+guia/gi,
];

function analyzeTone(
	content: string,
): { score: number; issues: string[]; suggestions: string[] } {
	const issues: string[] = [];
	const suggestions: string[] = [];
	let score = 100;

	let alarmistCount = 0;
	for (const { pattern, severity } of ALARMIST_PATTERNS_DATA) {
		const matches = content.match(pattern);
		if (matches) {
			alarmistCount += matches.length;
			const penalty =
				severity === "high" ? 15 : severity === "medium" ? 10 : 5;
			score -= penalty * matches.length;
		}
	}

	let manipulativeCount = 0;
	for (const pattern of MANIPULATIVE_PATTERNS_DATA) {
		const matches = content.match(pattern);
		if (matches) {
			manipulativeCount += matches.length;
			score -= 8 * matches.length;
		}
	}

	let clickbaitCount = 0;
	for (const pattern of CLICKBAIT_PATTERNS_DATA) {
		if (pattern.test(content)) {
			clickbaitCount++;
			score -= 5;
		}
	}

	if (alarmistCount > 0) {
		issues.push(`${alarmistCount} alarmist pattern(s) detected`);
		suggestions.push(
			"Replace alarmist language with balanced, evidence-based statements",
		);
	}

	if (manipulativeCount > 0) {
		issues.push(`${manipulativeCount} manipulative pattern(s) detected`);
		suggestions.push("Remove artificial urgency and fear-based messaging");
	}

	if (clickbaitCount > 0) {
		issues.push(`${clickbaitCount} clickbait indicator(s) found`);
		suggestions.push(
			"Use specific, honest headlines instead of sensationalist hooks",
		);
	}

	if (alarmistCount === 0 && manipulativeCount === 0) {
		score = Math.min(100, score + 10);
	}

	return { score: Math.max(0, score), issues, suggestions };
}

// ---------------------------------------------------------------------------
// Structure aspect (ported from content-structure-tool.ts)
// ---------------------------------------------------------------------------

function analyzeStructure(
	content: string,
): { score: number; issues: string[]; suggestions: string[] } {
	const issues: string[] = [];
	const suggestions: string[] = [];
	let score = 100;

	const words = content.split(/\s+/).filter(Boolean);
	const wordCount = words.length;
	const paragraphs = content.split(/\n\n+/).filter(Boolean);

	const headingMatches = content.matchAll(/^(#{1,6})\s+(.+)$/gm);
	const headings: { level: number; text: string }[] = [];
	for (const match of headingMatches) {
		const hashMarks = match[1];
		const headingText = match[2];
		if (hashMarks && headingText) {
			headings.push({ level: hashMarks.length, text: headingText });
		}
	}

	// No H1 in body
	if (headings.some((h) => h.level === 1)) {
		issues.push("H1 heading found in content body");
		suggestions.push(
			"Remove H1 from content. The title is in frontmatter. Start with H2.",
		);
		score -= 15;
	}

	// Heading hierarchy
	for (let i = 1; i < headings.length; i++) {
		const prev = headings[i - 1];
		const curr = headings[i];
		if (!prev || !curr) continue;
		if (curr.level > prev.level + 1) {
			issues.push(
				`Heading level skipped: H${prev.level} to H${curr.level} ("${curr.text}")`,
			);
			suggestions.push(
				`Don't skip heading levels. Use H${prev.level + 1} instead of H${curr.level}.`,
			);
			score -= 5;
		}
	}

	// Quick answer
	const first100Words = words.slice(0, 100).join(" ");
	const hasQuickAnswer =
		/\*\*quick\s*answer\*\*|>.*quick.*answer|tl;?dr|em\s+resumo|resumindo/i.test(
			first100Words,
		) ||
		/^.*?\*\*[^*]+\*\*\s+(?:é|is|are|was|were|significa)\s/im.test(
			first100Words,
		) ||
		/^\|.*\|.*\|$/m.test(first100Words);

	if (!hasQuickAnswer && wordCount > 300) {
		issues.push("No quick answer detected in first 100 words");
		suggestions.push(
			"Add a TL;DR box, definition lead, or comparison table early to answer the reader's question immediately.",
		);
		score -= 10;
	}

	// Long paragraphs
	let longParagraphCount = 0;
	for (const paragraph of paragraphs) {
		if (paragraph.startsWith("#") || paragraph.startsWith("```")) continue;
		const sentences = paragraph.split(/[.!?]+/).filter(Boolean);
		if (sentences.length > 4) longParagraphCount++;
	}
	if (longParagraphCount > 0) {
		issues.push(`${longParagraphCount} paragraph(s) exceed 4 sentences`);
		suggestions.push(
			"Break up long paragraphs. Aim for 2-4 sentences per paragraph.",
		);
		score -= Math.min(longParagraphCount * 2, 10);
	}

	// H2 frequency
	const h2Count = headings.filter((h) => h.level === 2).length;
	const expectedH2 = Math.floor(wordCount / 250);
	if (h2Count < expectedH2 && wordCount > 500) {
		issues.push(
			`Only ${h2Count} H2 headings for ${wordCount} words (recommended: ${expectedH2})`,
		);
		suggestions.push(
			"Add more H2 headings. Aim for one H2 every 200-300 words.",
		);
		score -= 5;
	}

	// Table of contents
	const hasToC =
		/##\s*(?:table of contents|sumário|índice|contents)/i.test(content) ||
		/\[.*\]\(#.*\)/.test(content.slice(0, 500));
	if (wordCount > 1500 && !hasToC) {
		issues.push("No table of contents detected for long-form content");
		suggestions.push(
			"Add a table of contents near the beginning for posts over 1500 words.",
		);
		score -= 3;
	}

	// Conclusion
	const hasConclusion =
		/##\s*(?:conclus|conclusion|resumo|takeaway|key\s*takeaway|final|wrapping\s*up)/i.test(
			content,
		);
	if (!hasConclusion && wordCount > 500) {
		issues.push("No conclusion section detected");
		suggestions.push("Add a conclusion with key takeaways and a call-to-action.");
		score -= 5;
	}

	return { score: Math.max(0, Math.min(100, score)), issues, suggestions };
}

// ---------------------------------------------------------------------------
// Citations aspect (ported from citation-tool.ts)
// ---------------------------------------------------------------------------

const CITATION_STATISTIC_PATTERNS = [
	/(\d+(?:[,.]\d+)?)\s*%\s+(?:dos?|das?|de|of|from)/gi,
	/(\d+(?:[,.]\d+)?)\s*(?:bilh[õo]es?|milh[õo]es?|mil|billion|million|thousand)/gi,
	/(\d+)\s+(?:em\s+cada|out\s+of|de\s+cada)\s+(\d+)/gi,
	/(?:em|in|desde|since)\s+20\d{2}[,\s]+(?:\d+)/gi,
];

const CITATION_CLAIM_PATTERNS = [
	/estudos\s+(?:mostram|indicam|revelam|comprovam)/gi,
	/pesquisas?\s+(?:mostram?|indicam?|revelam?)/gi,
	/(?:segundo|de acordo com)\s+(?:especialistas|experts|pesquisadores)/gi,
	/(?:cientistas|researchers)\s+(?:descobriram|found|discovered)/gi,
	/é\s+(?:comprovado|provado|científico)\s+que/gi,
	/(?:a maioria|most|majority)\s+(?:dos?|of)\s+/gi,
];

function hasCitationNearby(content: string, matchIndex: number): boolean {
	const start = Math.max(0, matchIndex - 100);
	const end = Math.min(content.length, matchIndex + 200);
	const context = content.slice(start, end);

	return (
		/\[[^\]]+\]\([^)]+\)/.test(context) ||
		/\[\^?\d+\]/.test(context) ||
		/(?:source|fonte|according to|de acordo com|segundo)\s*:/i.test(context)
	);
}

function analyzeCitations(
	content: string,
): { score: number; issues: string[]; suggestions: string[] } {
	const issues: string[] = [];
	const suggestions: string[] = [];
	let score = 100;

	let uncitedStats = 0;
	for (const pattern of CITATION_STATISTIC_PATTERNS) {
		const globalPattern = new RegExp(pattern.source, `${pattern.flags}g`);
		let match: RegExpExecArray | null;
		// biome-ignore lint/suspicious/noAssignInExpressions: Standard regex iteration pattern
		while ((match = globalPattern.exec(content)) !== null) {
			if (!hasCitationNearby(content, match.index)) {
				uncitedStats++;
			}
		}
	}

	let uncitedClaims = 0;
	for (const pattern of CITATION_CLAIM_PATTERNS) {
		const globalPattern = new RegExp(pattern.source, `${pattern.flags}g`);
		let match: RegExpExecArray | null;
		// biome-ignore lint/suspicious/noAssignInExpressions: Standard regex iteration pattern
		while ((match = globalPattern.exec(content)) !== null) {
			if (!hasCitationNearby(content, match.index)) {
				uncitedClaims++;
			}
		}
	}

	if (uncitedStats > 0) {
		issues.push(`${uncitedStats} statistic(s) without citations`);
		suggestions.push(
			"Add source links for statistics to build credibility",
		);
		// Fix M3: cap penalty at 50
		score -= Math.min(uncitedStats * 10, 50);
	}

	if (uncitedClaims > 0) {
		issues.push(`${uncitedClaims} claim(s) that need citations`);
		suggestions.push(
			"Replace generic claims like 'studies show' with specific references",
		);
		// Fix M3: cap penalty at 40
		score -= Math.min(uncitedClaims * 8, 40);
	}

	return { score: Math.max(0, score), issues, suggestions };
}

// ---------------------------------------------------------------------------
// Patterns aspect (ported from bad-pattern-tool.ts)
// ---------------------------------------------------------------------------

function findOccurrences(regex: RegExp, text: string): string[] {
	const matches: string[] = [];
	let match: RegExpExecArray | null;
	const globalRegex = new RegExp(regex.source, `${regex.flags.includes("g") ? regex.flags : `${regex.flags}g`}`);
	// biome-ignore lint/suspicious/noAssignInExpressions: Standard regex iteration pattern
	while ((match = globalRegex.exec(text)) !== null) {
		const start = Math.max(0, match.index - 20);
		const end = Math.min(text.length, match.index + match[0].length + 20);
		matches.push(`...${text.slice(start, end)}...`);
	}
	return matches;
}

function analyzePatterns(
	content: string,
): { score: number; issues: string[]; suggestions: string[] } {
	const issues: string[] = [];
	const suggestions: string[] = [];
	let patternCount = 0;

	// Word count mentions
	const wordCountPattern =
		/\b\d+\+?\s*(?:palavras?|words?)\b|~\s*\d+\s*(?:palavras?|words?)|word\s*count|contagem\s*de\s*palavras/gi;
	if (findOccurrences(wordCountPattern, content).length > 0) {
		patternCount++;
		issues.push("Word count mentioned in content");
		suggestions.push(
			"Remove word count mentions. Readers don't care about article length.",
		);
	}

	// Meta-commentary
	const metaPatterns = [
		/\b(?:neste\s+artigo|in\s+this\s+(?:article|post|guide))\b/gi,
		/\b(?:como\s+mencionado|as\s+(?:mentioned|discussed|noted)\s+(?:above|earlier|before))\b/gi,
		/\b(?:vamos\s+explorar|let'?s\s+explore|we\s+will\s+(?:discuss|explore|cover))\b/gi,
	];
	for (const pattern of metaPatterns) {
		if (findOccurrences(pattern, content).length > 0) {
			patternCount++;
			issues.push("Meta-commentary detected");
			suggestions.push(
				"Remove meta-commentary. Just deliver the information directly.",
			);
			break;
		}
	}

	// Engagement begging
	const engagementPatterns = [
		/\b(?:não\s+esqueça\s+de|don'?t\s+forget\s+to)\s+(?:curtir|like|subscribe|seguir|compartilhar|share)/gi,
		/\b(?:deixe\s+(?:um\s+)?comentário|leave\s+a\s+comment|comment\s+below)/gi,
		/\bsmash\s+(?:that\s+)?(?:like|subscribe)\s+button\b/gi,
	];
	for (const pattern of engagementPatterns) {
		if (findOccurrences(pattern, content).length > 0) {
			patternCount++;
			issues.push("Engagement begging detected");
			suggestions.push(
				"Remove engagement begging. Let quality content earn engagement naturally.",
			);
			break;
		}
	}

	// Endless introduction
	const firstH2Index = content.search(/^##\s+/m);
	if (firstH2Index > 0) {
		const introWords = content.slice(0, firstH2Index).split(/\s+/).filter(Boolean).length;
		if (introWords > 150) {
			patternCount++;
			issues.push(`Introduction is too long (~${introWords} words before first H2)`);
			suggestions.push(
				"Shorten introduction to under 150 words. Get to the point faster.",
			);
		}
	}

	// Filler phrases
	const fillerPatterns = [
		/\b(?:it\s+goes\s+without\s+saying|vai\s+sem\s+dizer)\b/gi,
		/\b(?:without\s+further\s+ado|sem\s+mais\s+delongas)\b/gi,
		/\b(?:at\s+the\s+end\s+of\s+the\s+day|no\s+final\s+das\s+contas)\b/gi,
		/\b(?:in\s+today'?s\s+(?:digital\s+)?(?:landscape|world|age))\b/gi,
		/\b(?:needless\s+to\s+say|escusado\s+será\s+dizer)\b/gi,
	];
	for (const pattern of fillerPatterns) {
		if (findOccurrences(pattern, content).length > 0) {
			patternCount++;
			issues.push("Filler phrases detected");
			suggestions.push(
				"Remove filler phrases. They add no value and waste reader's time.",
			);
			break;
		}
	}

	// Wall of text
	const paragraphs = content.split(/\n\n+/).filter(Boolean);
	const longParagraphs = paragraphs.filter((p) => {
		if (p.startsWith("```") || p.startsWith("#")) return false;
		return p.split(/\s+/).filter(Boolean).length > 100;
	});
	if (longParagraphs.length > 0) {
		patternCount++;
		issues.push(`${longParagraphs.length} paragraph(s) over 100 words (wall of text)`);
		suggestions.push(
			"Break up long paragraphs. Keep paragraphs under 100 words for better readability.",
		);
	}

	// Score: 100 minus 10 per pattern issue found
	const score = Math.max(0, 100 - patternCount * 10);

	return { score, issues, suggestions };
}

// ---------------------------------------------------------------------------
// Keywords aspect (ported from keyword-density-tool.ts)
// ---------------------------------------------------------------------------

function analyzeKeywords(
	content: string,
	title: string | undefined,
	keywords: string[] | undefined,
): { score: number; issues: string[]; suggestions: string[] } {
	const issues: string[] = [];
	const suggestions: string[] = [];

	if (!keywords || keywords.length === 0) {
		// Fix M4: return score 0 (not 100) when no keywords provided — no analysis possible
		return {
			score: 0,
			issues: ["No target keywords provided for keyword analysis"],
			suggestions: ["Provide target keywords to get keyword density analysis"],
		};
	}

	const words = content.toLowerCase().split(/\s+/).filter(Boolean);
	const totalWordCount = words.length;
	let totalScore = 0;

	for (const keyword of keywords) {
		const keywordLower = keyword.toLowerCase();
		const regex = new RegExp(
			`\\b${keywordLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
			"gi",
		);

		const matches = content.toLowerCase().match(regex) ?? [];
		const count = matches.length;
		const density = Number(((count / totalWordCount) * 100).toFixed(2));

		if (count === 0) {
			issues.push(`Keyword "${keyword}" not found in content`);
			suggestions.push(
				`Add "${keyword}" to your content, especially in headings and the first paragraph`,
			);
			totalScore += 0;
		} else if (density < 0.5) {
			issues.push(`Keyword "${keyword}" has low density (${density}%)`);
			suggestions.push(`Increase usage of "${keyword}" - aim for 1-2% density`);
			totalScore += 40;
		} else if (density > 3) {
			issues.push(`Keyword "${keyword}" may be overused (${density}% density)`);
			suggestions.push(
				`Reduce usage of "${keyword}" - currently ${density}%, aim for 1-2%`,
			);
			totalScore += 60;
		} else {
			totalScore += 100;
			if (title && !title.toLowerCase().includes(keywordLower)) {
				suggestions.push(
					`Consider adding "${keyword}" to the title for better SEO`,
				);
			}
		}
	}

	return {
		score: Math.round(totalScore / keywords.length),
		issues,
		suggestions,
	};
}

// ---------------------------------------------------------------------------
// Links aspect (ported from link-density-tool.ts)
// ---------------------------------------------------------------------------

const LINK_PATTERN_REGEX = /(?<!!)\[([^\]]+)\]\(([^)]+)\)/g;

function isInternalLink(url: string): boolean {
	if (url.startsWith("/") || url.startsWith("#") || url.startsWith("./")) {
		return true;
	}
	if (url.startsWith("blog/") || url.startsWith("../")) {
		return true;
	}
	if (url.startsWith("http://") || url.startsWith("https://")) {
		return false;
	}
	return true;
}

function assessAnchorQuality(anchor: string): "good" | "poor" {
	const genericAnchors =
		/^(?:aqui|clique|saiba mais|leia mais|here|click|read more|learn more|link)$/i;
	if (genericAnchors.test(anchor.trim())) return "poor";
	if (anchor.length < 3) return "poor";
	if (/^https?:\/\//.test(anchor)) return "poor";
	return "good";
}

function analyzeLinks(
	content: string,
): { score: number; issues: string[]; suggestions: string[] } {
	const issues: string[] = [];
	const suggestions: string[] = [];
	let score = 100;

	const wordCount = countWords(content);
	let internalCount = 0;
	let externalCount = 0;
	let poorAnchorCount = 0;

	const pattern = new RegExp(LINK_PATTERN_REGEX.source, LINK_PATTERN_REGEX.flags);
	let match: RegExpExecArray | null;
	// biome-ignore lint/suspicious/noAssignInExpressions: Standard regex iteration pattern
	while ((match = pattern.exec(content)) !== null) {
		const anchor = match[1] ?? "";
		const url = match[2] ?? "";
		if (isInternalLink(url)) {
			internalCount++;
		} else {
			externalCount++;
		}
		if (assessAnchorQuality(anchor) === "poor") {
			poorAnchorCount++;
		}
	}

	const factor = wordCount / 1000;
	const recommendedInternal = Math.max(2, Math.round(factor * 3));
	const recommendedExternal = Math.max(1, Math.round(factor * 1.5));

	if (internalCount === 0) {
		issues.push("No internal links found");
		suggestions.push(
			`Add ${recommendedInternal} internal links to related content`,
		);
		score -= 25;
	} else if (internalCount < recommendedInternal) {
		issues.push(
			`Few internal links (${internalCount}/${recommendedInternal} recommended)`,
		);
		suggestions.push(
			`Add ${recommendedInternal - internalCount} more internal links to related blog posts`,
		);
		score -= 15;
	}

	if (externalCount === 0) {
		issues.push("No external links to authoritative sources");
		suggestions.push(
			`Add ${recommendedExternal} external links to authoritative sources`,
		);
		score -= 20;
	} else if (externalCount < recommendedExternal) {
		issues.push(
			`Few external links (${externalCount}/${recommendedExternal} recommended)`,
		);
		suggestions.push(
			"Add more external links to authoritative sources to support claims",
		);
		score -= 10;
	}

	if (poorAnchorCount > 0) {
		issues.push(`${poorAnchorCount} link(s) have poor anchor text`);
		suggestions.push(
			'Use descriptive anchor text instead of generic phrases like "clique aqui" or "saiba mais"',
		);
		score -= poorAnchorCount * 5;
	}

	return { score: Math.max(0, score), issues, suggestions };
}

// ---------------------------------------------------------------------------
// Images aspect (ported from image-seo-tool.ts)
// ---------------------------------------------------------------------------

const IMAGE_PATTERN_REGEX =
	/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;

function assessAltQuality(alt: string): "good" | "poor" | "missing" {
	if (!alt || alt.trim() === "") return "missing";
	if (alt.length < 10) return "poor";
	if (/^(?:image|img|foto|imagem)\d*$/i.test(alt)) return "poor";
	if (/^[a-z0-9_-]+\.[a-z]+$/i.test(alt)) return "poor";
	if (alt.split(/\s+/).length >= 3) return "good";
	return "poor";
}

function analyzeImages(
	content: string,
): { score: number; issues: string[]; suggestions: string[] } {
	const issues: string[] = [];
	const suggestions: string[] = [];
	let score = 100;

	const wordCount = countWords(content);
	const pattern = new RegExp(
		IMAGE_PATTERN_REGEX.source,
		IMAGE_PATTERN_REGEX.flags,
	);

	let imageCount = 0;
	let missingAlt = 0;
	let poorAlt = 0;

	let match: RegExpExecArray | null;
	// biome-ignore lint/suspicious/noAssignInExpressions: Standard regex iteration pattern
	while ((match = pattern.exec(content)) !== null) {
		imageCount++;
		const alt = match[1] ?? "";
		const quality = assessAltQuality(alt);
		if (quality === "missing") missingAlt++;
		else if (quality === "poor") poorAlt++;
	}

	let recommendedCount: number;
	if (wordCount < 300) recommendedCount = 1;
	else if (wordCount < 800) recommendedCount = 2;
	else if (wordCount < 1500) recommendedCount = 3;
	else if (wordCount < 2500) recommendedCount = 5;
	else recommendedCount = Math.min(8, Math.ceil(wordCount / 400));

	if (imageCount === 0) {
		issues.push("No images found in content");
		suggestions.push(
			`Add ${recommendedCount} images with descriptive alt text`,
		);
		score -= 30;
	} else if (imageCount < recommendedCount) {
		issues.push(
			`Few images for content length (${imageCount}/${recommendedCount} recommended)`,
		);
		suggestions.push(
			`Consider adding ${recommendedCount - imageCount} more images`,
		);
		score -= 15;
	}

	if (missingAlt > 0) {
		issues.push(`${missingAlt} image(s) missing alt text`);
		suggestions.push("Add descriptive alt text to all images");
		score -= missingAlt * 10;
	}

	if (poorAlt > 0) {
		issues.push(`${poorAlt} image(s) have poor quality alt text`);
		suggestions.push(
			"Improve alt text to be more descriptive (include what the image shows and relevant keywords)",
		);
		score -= poorAlt * 5;
	}

	return { score: Math.max(0, score), issues, suggestions };
}

// ---------------------------------------------------------------------------
// Duplicates aspect (ported from duplicate-content-tool.ts)
// ---------------------------------------------------------------------------

const MIN_PARAGRAPH_LENGTH = 50;
const SIMILARITY_THRESHOLD = 0.8;

function normalizeText(text: string): string {
	return text
		.toLowerCase()
		.replace(/[^\w\s]/g, "")
		.replace(/\s+/g, " ")
		.trim();
}

function calculateSimilarity(str1: string, str2: string): number {
	if (str1 === str2) return 1;
	if (str1.length === 0 || str2.length === 0) return 0;
	const words1 = new Set(str1.split(" "));
	const words2 = new Set(str2.split(" "));
	const intersection = new Set([...words1].filter((w) => words2.has(w)));
	const union = new Set([...words1, ...words2]);
	return intersection.size / union.size;
}

function analyzeDuplicates(
	content: string,
): { score: number; issues: string[]; suggestions: string[] } {
	const issues: string[] = [];
	const suggestions: string[] = [];
	let score = 100;

	const paragraphs = content
		.split(/\n\n+/)
		.filter(Boolean)
		.filter(
			(p) =>
				!p.startsWith("#") &&
				!p.startsWith("```") &&
				p.length >= MIN_PARAGRAPH_LENGTH,
		)
		.map((p) => normalizeText(p));

	const duplicateGroups: Array<[number, number]> = [];
	const processed = new Set<number>();

	for (let i = 0; i < paragraphs.length; i++) {
		if (processed.has(i)) continue;
		const para = paragraphs[i];
		if (!para) continue;

		for (let j = i + 1; j < paragraphs.length; j++) {
			if (processed.has(j)) continue;
			const other = paragraphs[j];
			if (!other) continue;

			const similarity = calculateSimilarity(para, other);
			if (similarity >= SIMILARITY_THRESHOLD) {
				duplicateGroups.push([i, j]);
				processed.add(i);
				processed.add(j);
			}
		}
	}

	const exactDupes = duplicateGroups.filter(([i, j]) => {
		const pi = paragraphs[i];
		const pj = paragraphs[j];
		return pi && pj && pi === pj;
	});
	const nearDupes = duplicateGroups.filter(([i, j]) => {
		const pi = paragraphs[i];
		const pj = paragraphs[j];
		return pi && pj && pi !== pj;
	});

	if (exactDupes.length > 0) {
		issues.push(
			`${exactDupes.length} exact duplicate section(s) found (likely copy-paste error)`,
		);
		suggestions.push(
			"Remove duplicate sections - they appear to be copy-paste errors",
		);
		score -= exactDupes.length * 20;
	}

	if (nearDupes.length > 0) {
		issues.push(`${nearDupes.length} near-duplicate section(s) found`);
		suggestions.push(
			"Review similar sections and consolidate or differentiate the content",
		);
		score -= nearDupes.length * 10;
	}

	return { score: Math.max(0, score), issues, suggestions };
}

// ---------------------------------------------------------------------------
// analyzeContent tool
// ---------------------------------------------------------------------------

export const analyzeContentTool = createTool({
	id: "analyze-content",
	description:
		"Analyzes blog post content across multiple dimensions: SEO, readability, tone, structure, citations, bad patterns, keyword density, link density, image SEO, and duplicate content. Returns a unified score with aspect-level breakdowns, top issues, and a summary. Note: 'seo' and 'structure' aspects overlap on H1 and conclusion checks — running both will surface duplicate issues.",
	inputSchema: z.object({
		content: z.string().describe("The markdown content to analyze"),
		title: z.string().optional(),
		description: z.string().optional(),
		keywords: z.array(z.string()).optional(),
		aspects: z
			.array(
				z.enum([
					"seo",
					"readability",
					"tone",
					"structure",
					"citations",
					"patterns",
					"keywords",
					"links",
					"images",
					"duplicates",
				]),
			)
			.default(["seo", "readability", "structure", "patterns"])
			.describe("Which aspects to analyze. Defaults to seo, readability, structure, and patterns."),
	}),
	outputSchema: z.object({
		score: z.number().min(0).max(100),
		aspects: z.record(
			z.string(),
			z.object({
				score: z.number(),
				issues: z.array(z.string()),
				suggestions: z.array(z.string()),
			}),
		),
		summary: z.string(),
		topIssues: z.array(z.string()),
	}),
	execute: async (inputData) => {
		const { content, title, description, keywords, aspects } = inputData;

		const aspectResults: Record<
			string,
			{ score: number; issues: string[]; suggestions: string[] }
		> = {};

		for (const aspect of aspects) {
			switch (aspect) {
				case "seo":
					aspectResults.seo = analyzeSeo(content, title, description, keywords);
					break;
				case "readability":
					aspectResults.readability = analyzeReadability(content);
					break;
				case "tone":
					aspectResults.tone = analyzeTone(content);
					break;
				case "structure":
					aspectResults.structure = analyzeStructure(content);
					break;
				case "citations":
					aspectResults.citations = analyzeCitations(content);
					break;
				case "patterns":
					aspectResults.patterns = analyzePatterns(content);
					break;
				case "keywords":
					aspectResults.keywords = analyzeKeywords(content, title, keywords);
					break;
				case "links":
					aspectResults.links = analyzeLinks(content);
					break;
				case "images":
					aspectResults.images = analyzeImages(content);
					break;
				case "duplicates":
					aspectResults.duplicates = analyzeDuplicates(content);
					break;
			}
		}

		// Overall score: average of all aspect scores
		const aspectScores = Object.values(aspectResults).map((r) => r.score);
		const overallScore =
			aspectScores.length > 0
				? Math.round(
						aspectScores.reduce((sum, s) => sum + s, 0) /
							aspectScores.length,
					)
				: 0;

		// Collect all issues across aspects and pick top 3
		const allIssues: string[] = [];
		for (const [aspect, result] of Object.entries(aspectResults)) {
			for (const issue of result.issues) {
				allIssues.push(`[${aspect}] ${issue}`);
			}
		}

		// Sort: aspects with lower scores first to surface critical issues
		const sortedByAspectScore = allIssues.sort((a, b) => {
			const aspectA = a.match(/^\[(\w+)\]/)?.[1] ?? "";
			const aspectB = b.match(/^\[(\w+)\]/)?.[1] ?? "";
			const scoreA = aspectResults[aspectA]?.score ?? 100;
			const scoreB = aspectResults[aspectB]?.score ?? 100;
			return scoreA - scoreB;
		});
		const topIssues = sortedByAspectScore.slice(0, 3);

		// Summary
		const weakAspects = Object.entries(aspectResults)
			.filter(([, r]) => r.score < 70)
			.map(([name]) => name);

		let summary: string;
		if (overallScore >= 85) {
			summary = `Content is in good shape with an overall score of ${overallScore}/100. Minor improvements may be needed in ${weakAspects.length > 0 ? weakAspects.join(", ") : "a few areas"}.`;
		} else if (overallScore >= 60) {
			summary = `Content needs improvement with an overall score of ${overallScore}/100. Focus on: ${weakAspects.slice(0, 3).join(", ")}.`;
		} else {
			summary = `Content has significant issues with an overall score of ${overallScore}/100. Priority areas: ${weakAspects.slice(0, 3).join(", ")}.`;
		}

		return {
			score: overallScore,
			aspects: aspectResults,
			summary,
			topIssues,
		};
	},
});
