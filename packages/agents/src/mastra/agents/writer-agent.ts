import { Agent } from "@mastra/core/agent";
import type { InstructionMemoryItem } from "@packages/database/schemas/instruction-memory";
import { compileInstructionMemories } from "../helpers";
// Analysis tools — direct imports
import {
   badPatternTool,
   getBadPatternInstructions,
} from "../tools/analysis/bad-pattern-tool";
import {
   citationTool,
   getCitationInstructions,
} from "../tools/analysis/citation-tool";
import {
   contentStructureTool,
   getContentStructureInstructions,
} from "../tools/analysis/content-structure-tool";
import {
   duplicateContentTool,
   getDuplicateContentInstructions,
} from "../tools/analysis/duplicate-content-tool";
import {
   getImageSeoInstructions,
   imageSeoTool,
} from "../tools/analysis/image-seo-tool";
import {
   getKeywordDensityInstructions,
   keywordDensityTool,
} from "../tools/analysis/keyword-density-tool";
import {
   getLinkDensityInstructions,
   linkDensityTool,
} from "../tools/analysis/link-density-tool";
import {
   getOriginalityInstructions,
   originalityTool,
} from "../tools/analysis/originality-tool";
import {
   getQuickAnswerAnalysisInstructions,
   quickAnswerAnalysisTool,
} from "../tools/analysis/quick-answer-tool";
import {
   getReadabilityInstructions,
   readabilityTool,
} from "../tools/analysis/readability-tool";
import {
   getSeoScoreInstructions,
   seoScoreTool,
} from "../tools/analysis/seo-score-tool";
import {
   getTitleMetaInstructions,
   titleMetaTool,
} from "../tools/analysis/title-meta-tool";
import {
   getToneAnalysisInstructions,
   toneAnalysisTool,
} from "../tools/analysis/tone-analysis-tool";
// Editor tools — direct imports
import {
   addExternalLinksTool,
   getAddExternalLinksInstructions,
} from "../tools/editor/add-external-links-tool";
import {
   addInternalLinksTool,
   getAddInternalLinksInstructions,
} from "../tools/editor/add-internal-links-tool";
import {
   deleteTextTool,
   getDeleteTextInstructions,
} from "../tools/editor/delete-text-tool";
import {
   formatTextTool,
   getFormatTextInstructions,
} from "../tools/editor/format-text-tool";
import {
   generateQuickAnswerTool,
   getGenerateQuickAnswerInstructions,
} from "../tools/editor/generate-quick-answer-tool";
import {
   getImproveReadabilityInstructions,
   improveReadabilityTool,
} from "../tools/editor/improve-readability-tool";
import {
   getInjectKeywordsInstructions,
   injectKeywordsTool,
} from "../tools/editor/inject-keywords-tool";
import {
   getInsertCodeBlockInstructions,
   insertCodeBlockTool,
} from "../tools/editor/insert-code-block-tool";
import {
   getInsertHeadingInstructions,
   insertHeadingTool,
} from "../tools/editor/insert-heading-tool";
import {
   getInsertImageInstructions,
   insertImageTool,
} from "../tools/editor/insert-image-tool";
import {
   getInsertListInstructions,
   insertListTool,
} from "../tools/editor/insert-list-tool";
import {
   getInsertTableInstructions,
   insertTableTool,
} from "../tools/editor/insert-table-tool";
import {
   getInsertTextInstructions,
   insertTextTool,
} from "../tools/editor/insert-text-tool";
import {
   getOptimizeMetaInstructions,
   optimizeMetaTool,
} from "../tools/editor/optimize-meta-tool";
import {
   getOptimizeTitleInstructions,
   optimizeTitleTool,
} from "../tools/editor/optimize-title-tool";
import {
   getReplaceTextInstructions,
   replaceTextTool,
} from "../tools/editor/replace-text-tool";
import {
   getSuggestImagesInstructions,
   suggestImagesTool,
} from "../tools/editor/suggest-images-tool";
// Frontmatter tools — direct imports
import {
   editDescriptionTool,
   getEditDescriptionInstructions,
} from "../tools/frontmatter/edit-description-tool";
import {
   editKeywordsTool,
   getEditKeywordsInstructions,
} from "../tools/frontmatter/edit-keywords-tool";
import {
   editSlugTool,
   getEditSlugInstructions,
} from "../tools/frontmatter/edit-slug-tool";
import {
   editTitleTool,
   getEditTitleInstructions,
} from "../tools/frontmatter/edit-title-tool";
// Memory tools — direct imports
import { getInstructionsTool } from "../tools/memory/get-instructions-tool";

// RAG tools — direct imports
import {
   getGraphSearchInstructions,
   graphSearchTool,
} from "../tools/rag/graph-search-tool";
import {
   getSearchPreviousContentInstructions,
   searchPreviousContentTool,
} from "../tools/rag/search-previous-content-tool";
import { LANGUAGE_INSTRUCTION } from "./shared";

// ─── Tool instruction aggregators ────────────────────────────────────────────

function getAllEditorToolInstructions(): string {
   return `
# EDITOR TOOLS
These tools allow you to manipulate the blog post content directly.

${getInsertTextInstructions()}
${getReplaceTextInstructions()}
${getDeleteTextInstructions()}
${getFormatTextInstructions()}
${getInsertHeadingInstructions()}
${getInsertListInstructions()}
${getInsertCodeBlockInstructions()}
${getInsertTableInstructions()}
${getInsertImageInstructions()}

# SEO OPTIMIZATION TOOLS
These tools help optimize content for search engines.

${getInjectKeywordsInstructions()}
${getAddInternalLinksInstructions()}
${getImproveReadabilityInstructions()}

# NEW SEO ACTION TOOLS
These tools fix specific SEO issues detected by analysis tools.

${getOptimizeTitleInstructions()}
${getOptimizeMetaInstructions()}
${getGenerateQuickAnswerInstructions()}
${getSuggestImagesInstructions()}
${getAddExternalLinksInstructions()}
`;
}

function getAllFrontmatterToolInstructions(): string {
   return [
      getEditTitleInstructions(),
      getEditDescriptionInstructions(),
      getEditSlugInstructions(),
      getEditKeywordsInstructions(),
   ].join("\n");
}

function getAllAnalysisToolInstructions(): string {
   return `
# ANALYSIS TOOLS
These tools analyze the blog post for quality, SEO, and readability.

## EXISTING TOOLS
${getSeoScoreInstructions()}
${getReadabilityInstructions()}
${getKeywordDensityInstructions()}
${getContentStructureInstructions()}
${getBadPatternInstructions()}

## SEO ANALYSIS TOOLS
${getTitleMetaInstructions()}
${getQuickAnswerAnalysisInstructions()}
${getImageSeoInstructions()}
${getLinkDensityInstructions()}

## CONTENT QUALITY TOOLS
${getDuplicateContentInstructions()}
${getToneAnalysisInstructions()}
${getCitationInstructions()}
${getOriginalityInstructions()}
`;
}

function getAllRagToolInstructions(): string {
   return `
# RAG TOOLS
These tools allow you to search and reference previously published content.

${getSearchPreviousContentInstructions()}

${getGraphSearchInstructions()}
`;
}

// ─── Agent instructions ──────────────────────────────────────────────────────

const getWriterAgentInstructions = (
   writerInstructions?: InstructionMemoryItem[],
): string => {
   const compiledMemories = compileInstructionMemories(
      writerInstructions ?? [],
   );

   return `
You are an expert blog post writer and editor. You write and edit content directly using markdown in a Lexical rich text editor.

${LANGUAGE_INSTRUCTION}

${compiledMemories}

## FIRST STEPS - ALWAYS DO THIS
Before starting ANY writing task:
1. Set frontmatter first (editTitle, editDescription, editSlug, editKeywords)
2. Write or edit content using editor tools

## YOUR ROLE
You are a markdown content writer. You make edits directly using tools, thinking step-by-step.

## WRITING PRINCIPLES
- **Conversational but authoritative**: Write like explaining to a smart friend
- **Active voice**: "The team built" not "It was built by the team"
- **Second person**: Address the reader with "you" and "your"
- **Specific**: Use concrete examples and data over vague claims
- **Rhythmic**: Vary sentence length. Short punchy sentences. Then longer ones.

## ANSWER FIRST - THE GOLDEN RULE
The reader arrived with a question. Answer it IMMEDIATELY in the first 100 words.

### Quick Answer Formats
- **TL;DR Box**: > **Quick Answer:** [Direct answer in 1-2 sentences]
- **Definition Lead**: **[Term] is [one-sentence definition].**
- **Comparison Table**: Key differences upfront for scanners

### NEVER DO
- Long personal stories before the answer
- "In this article, we will explore..."
- Excessive preamble

## CONTENT STRUCTURES

### PASTOR Framework (How-To Content)
1. **P**roblem: Identify the pain point
2. **A**mplify: Show consequences
3. **S**tory: Relatable example
4. **T**estimony: Stats, quotes, research
5. **O**ffer: Solution step by step
6. **R**esponse: Clear CTA

### Inverted Pyramid (Informational)
1. Lead with the answer
2. Supporting details
3. Background/context
4. Related topics

### Power List (Listicles)
- Bold, benefit-driven subheadings
- Each item: What -> Why -> How
- Best items at positions 1, 3, and last

## ENGAGEMENT TECHNIQUES

### Bucket Brigades
Single-line transitions: "Here's the thing:" | "But wait—" | "The truth is:" | "And the best part?"

### Pattern Interrupts
- Short sentences. Like this.
- Direct questions: "See what I mean?"
- Bold callouts for **key insights**

### Show, Don't Tell
- BAD: "This technique is effective"
- GOOD: "This technique increased conversions by 47%"

## TABLE GUIDELINES

**Use tables for:** Feature comparisons, reference data, schedules
**Don't use for:** Single-column lists, sequential instructions, only 2 items

**Best practices:**
- Max 3-5 columns (mobile-friendly)
- Short headers (1-3 words)
- Left-align text, right-align numbers

## CRITICAL RULES

### Frontmatter First
ALWAYS update frontmatter BEFORE writing content:
1. **editTitle** - set the post title
2. **editDescription** - SEO meta (150-160 chars)
3. **editSlug** - URL slug
4. **editKeywords** - target keywords
5. THEN write content body

## KEYWORD USAGE - CRITICAL

When the user provides target keywords, use them consistently:

### Step 1: Set Keywords in Frontmatter
- Call **editKeywords** with the provided keywords (up to 10)
- These become the meta keywords for SEO

### Step 2: Use Primary Keyword in Content
The FIRST keyword is the PRIMARY keyword. It MUST appear in:
1. **Title** (via editTitle) - include near the beginning
2. **First 100 words** - REQUIRED, mention naturally in opening
3. **At least one H2 heading** - use as section header
4. **Throughout content** - target 1-2% density

### Step 3: Use Secondary Keywords
Secondary keywords should appear:
- Naturally in H2/H3 headings where relevant
- Distributed throughout body paragraphs
- Don't force them - only use where they fit naturally

### Validation After Writing
ALWAYS run these tools after completing content:
1. **keywordDensity** - verify primary keyword has 1-2% density
2. **seoScore** - ensure keywordInFirstParagraph is true, score >= 70

### No H1 in Content
- Title is in frontmatter, NOT in content body
- NEVER use # (H1) in content
- Start with ## (H2) for main sections

### NEVER Include
- Word counts ("2500+ words", "~350 palavras")
- Writing progress markers
- Meta-commentary about the article
- Internal notes or bracketed comments

### BAD Patterns to Avoid
- Endless introduction (>150 words before value)
- Keyword stuffing
- Walls of text (max 3-4 sentences per paragraph)
- Vague instructions ("configure appropriately")
- Filler phrases: "It goes without saying...", "Without further ado..."

## CONCLUSIONS
1. One-sentence recap
2. Key takeaways (3 max, bullets)
3. Single clear CTA

## QUALITY CHECKLIST
After writing, you MUST:
1. **Call seoScore** - fix issues if score < 70
2. **Call readability** - target Flesch score 60+
3. Verify: Hook in first sentence, H2 every 200-300 words, conclusion has takeaways

## INTERLEAVED THINKING
After each tool call:
1. **Reflect** on the result
2. **Think** about what's next
3. **Act** by calling the next tool

## MARKDOWN
- ## for H2, ### for H3
- **bold** and *italic* for emphasis
- \`code\` for inline code
- [text](url) for links
- For images: Use insertImage tool (NEVER write ![alt](url) manually)

## IMAGES
- Wait for user to provide URL
- Call insertImage with url, alt text, optional caption
- NEVER search for images or use placeholder URLs

## INTERNAL LINKING
- Use searchPreviousContent({ query: "topic", mode: "links" })
- Add contextual links: "See our [Title](/blog/slug)"

## AVAILABLE TOOLS

${getAllEditorToolInstructions()}

${getAllFrontmatterToolInstructions()}

${getAllAnalysisToolInstructions()}

${getAllRagToolInstructions()}
`;
};

// ─── Agent definition ────────────────────────────────────────────────────────

/**
 * Writer Agent
 *
 * A content writing agent for editing blog posts with tools for:
 * - Text manipulation (insert, replace, delete, format)
 * - Structure (headings, lists, code blocks, tables, images)
 * - Frontmatter (title, description, slug, keywords)
 * - Analysis (SEO, readability, keyword density)
 */
export const writerAgent = new Agent({
   id: "writer-agent",
   name: "Writer Agent",

   model: "openrouter/x-ai/grok-4.1-fast",

   instructions: ({ requestContext }) => {
      const writerInstructions = requestContext?.get("writerInstructions") as
         | InstructionMemoryItem[]
         | undefined;
      return getWriterAgentInstructions(writerInstructions);
   },

   tools: {
      // Editor tools
      insertText: insertTextTool,
      replaceText: replaceTextTool,
      deleteText: deleteTextTool,
      formatText: formatTextTool,
      insertHeading: insertHeadingTool,
      insertList: insertListTool,
      insertCodeBlock: insertCodeBlockTool,
      insertTable: insertTableTool,
      insertImage: insertImageTool,
      injectKeywords: injectKeywordsTool,
      addInternalLinks: addInternalLinksTool,
      improveReadability: improveReadabilityTool,
      optimizeTitle: optimizeTitleTool,
      optimizeMeta: optimizeMetaTool,
      generateQuickAnswer: generateQuickAnswerTool,
      suggestImages: suggestImagesTool,
      addExternalLinks: addExternalLinksTool,
      // Frontmatter tools
      editTitle: editTitleTool,
      editDescription: editDescriptionTool,
      editSlug: editSlugTool,
      editKeywords: editKeywordsTool,
      // Analysis tools
      seoScore: seoScoreTool,
      readability: readabilityTool,
      keywordDensity: keywordDensityTool,
      contentStructure: contentStructureTool,
      badPatterns: badPatternTool,
      titleMeta: titleMetaTool,
      quickAnswerAnalysis: quickAnswerAnalysisTool,
      imageSeo: imageSeoTool,
      linkDensity: linkDensityTool,
      duplicateContent: duplicateContentTool,
      toneAnalysis: toneAnalysisTool,
      citation: citationTool,
      originality: originalityTool,
      // RAG tools
      searchPreviousContent: searchPreviousContentTool,
      graphSearch: graphSearchTool,
      // Memory tools
      getInstructionMemories: getInstructionsTool,
   },
});
