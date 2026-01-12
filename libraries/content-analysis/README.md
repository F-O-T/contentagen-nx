# @f-o-t/content-analysis

A comprehensive content analysis library for SEO optimization, readability scoring, structure validation, and problematic pattern detection.

## Installation

```bash
# npm
npm install @f-o-t/content-analysis

# pnpm
pnpm add @f-o-t/content-analysis

# bun
bun add @f-o-t/content-analysis
```

## Features

- **SEO Analysis** - Title, meta description, headings, keywords, content length, links, images
- **Readability Scoring** - Flesch-Kincaid Reading Ease and Grade Level with audience targeting
- **Structure Validation** - Heading hierarchy, paragraph lengths, table of contents, conclusions
- **Bad Pattern Detection** - Clickbait, filler phrases, keyword stuffing, engagement begging
- **Keyword Analysis** - Density, placement, and optimization recommendations
- **Zero dependencies** - Lightweight and fast
- **Full TypeScript support** - All types exported

## Quick Start

### Combined Analysis

Run all analyzers at once with `analyzeContent()`:

```typescript
import { analyzeContent } from "@f-o-t/content-analysis";

const result = analyzeContent({
  content: "## Introduction\n\nThis is my blog post about TypeScript...",
  title: "Complete Guide to TypeScript in 2024",
  description: "Learn TypeScript from scratch with practical examples",
  targetKeywords: ["typescript", "tutorial"],
});

console.log(result.seo.score);           // 85
console.log(result.readability.fleschKincaidReadingEase); // 65.2
console.log(result.structure.structure.hasQuickAnswer);   // false
console.log(result.badPatterns.hasIssues);               // true
console.log(result.keywords?.overallScore);              // 90
```

### Individual Analyzers

Use specific analyzers when you only need certain metrics:

```typescript
import {
  analyzeSeo,
  analyzeReadability,
  analyzeStructure,
  analyzeBadPatterns,
  analyzeKeywords,
} from "@f-o-t/content-analysis";

// SEO analysis
const seo = analyzeSeo({
  content: "## Getting Started\n\nLearn how to...",
  title: "TypeScript Tutorial",
  metaDescription: "A comprehensive guide to TypeScript",
  targetKeywords: ["typescript", "tutorial"],
});

// Readability analysis
const readability = analyzeReadability(content, "general");

// Structure analysis
const structure = analyzeStructure(content, "how-to");

// Bad pattern detection
const badPatterns = analyzeBadPatterns(content, title);

// Keyword analysis
const keywords = analyzeKeywords({
  content,
  title,
  targetKeywords: ["typescript", "tutorial"],
});
```

## API Reference

### `analyzeContent(input)`

Performs comprehensive content analysis using all available analyzers.

```typescript
type AnalysisInput = {
  content: string;           // Markdown content to analyze
  title?: string;            // Page title
  description?: string;      // Meta description
  targetKeywords?: string[]; // Keywords to track
};

type ContentAnalysisResult = {
  seo: SeoResult;
  readability: ReadabilityResult;
  structure: StructureResult;
  badPatterns: BadPatternResult;
  keywords: KeywordAnalysisResult | null;
  analyzedAt: string;        // ISO timestamp
};
```

---

### `analyzeSeo(input)`

Analyzes content for search engine optimization factors.

**Checks performed:**
- Title length (optimal: 50-60 characters)
- Title contains target keyword
- Meta description length (optimal: 150-160 characters)
- Heading structure (H1 should not be in content)
- H2 heading frequency (1 per 200-300 words)
- Keywords in H2 headings
- Content length (minimum: 600-1000 words)
- Internal/external links
- Images with alt text
- Quick answer in first 100 words
- Keyword in first paragraph
- Keyword density (optimal: 1-2%)
- Conclusion section

```typescript
type SeoInput = {
  content: string;
  title?: string;
  metaDescription?: string;
  targetKeywords?: string[];
};

type SeoResult = {
  score: number;              // 0-100
  issues: SeoIssue[];         // Problems found
  recommendations: string[];  // Action items
  metrics: SeoMetrics;        // Counts and flags
};
```

---

### `analyzeReadability(content, targetAudience)`

Analyzes content readability using Flesch-Kincaid algorithms.

**Target audiences:**
| Audience | Reading Ease Range | Description |
|----------|-------------------|-------------|
| `general` | 60-70 | Easy to read for general audience |
| `technical` | 40-60 | Technical but accessible |
| `academic` | 30-50 | Academic/professional level |
| `casual` | 70-80 | Very easy, conversational |

```typescript
type ReadabilityResult = {
  fleschKincaidReadingEase: number;  // 0-100 (higher = easier)
  fleschKincaidGradeLevel: number;   // US grade level
  readabilityLevel: string;          // Human-readable description
  targetScore: TargetScore;          // Target range for audience
  isOnTarget: boolean;               // Within target range
  suggestions: string[];             // Improvement suggestions
  metrics: ReadabilityMetrics;       // Detailed metrics
};
```

**Reading Ease Scale:**
| Score | Level |
|-------|-------|
| 90-100 | Very Easy (5th grade) |
| 80-89 | Easy (6th grade) |
| 70-79 | Fairly Easy (7th grade) |
| 60-69 | Standard (8th-9th grade) |
| 50-59 | Fairly Difficult (10th-12th grade) |
| 30-49 | Difficult (College) |
| 0-29 | Very Difficult (College Graduate) |

---

### `analyzeStructure(content, contentType?)`

Analyzes content structure for SEO and readability best practices.

**Content types:**
- `how-to` - Expects numbered steps
- `comparison` - Expects comparison tables
- `listicle` - Expects multiple list items
- `explainer` - General explanatory content
- `general` - Default

**Checks performed:**
- H1 heading not in content body
- Heading hierarchy (no skipped levels)
- Quick answer in first 100 words
- Paragraph lengths (max 4 sentences recommended)
- H2 frequency (1 per 250 words)
- Table of contents for long content (1500+ words)
- Conclusion section

```typescript
type StructureResult = {
  score: number;                   // 0-100
  issues: StructureIssue[];        // Problems found
  structure: ContentStructure;     // Structure metrics
};

type ContentStructure = {
  hasQuickAnswer: boolean;
  headingHierarchyValid: boolean;
  avgParagraphLength: number;
  hasTableOfContents: boolean;
  hasTables: boolean;
  hasConclusion: boolean;
  headingCount: number;
  wordCount: number;
};
```

---

### `analyzeBadPatterns(content, title?)`

Detects problematic content patterns that hurt quality and SEO.

**Patterns detected:**

| Pattern | Description |
|---------|-------------|
| `word_count_mention` | References to word count in content |
| `word_count_in_title` | Word count claims in title |
| `meta_commentary` | "In this article...", "As mentioned above..." |
| `engagement_begging` | "Don't forget to like and subscribe" |
| `endless_introduction` | Introduction over 150 words |
| `vague_instructions` | "Configure appropriately", "Set up as needed" |
| `clickbait_markers` | "You won't believe...", excessive punctuation |
| `filler_phrases` | "Without further ado", "At the end of the day" |
| `over_formatting` | Excessive consecutive bold/italic |
| `wall_of_text` | Paragraphs over 100 words |
| `keyword_stuffing` | Phrase density over 3% |

```typescript
type BadPatternResult = {
  hasIssues: boolean;
  issueCount: number;
  patterns: BadPattern[];
};

type BadPattern = {
  pattern: string;           // Pattern type identifier
  severity: "error" | "warning";
  locations: string[];       // Context snippets
  suggestion: string;        // How to fix
};
```

---

### `analyzeKeywords(input)`

Analyzes keyword usage, density, and placement.

**Checks performed:**
- Keyword count and density (optimal: 0.5-3%)
- Keyword locations (title, headings, first/last 100 words)
- Missing keywords
- Overused keywords
- Top 10 most frequent words in content

```typescript
type KeywordInput = {
  content: string;
  title?: string;
  targetKeywords: string[];
};

type KeywordAnalysisResult = {
  analysis: KeywordAnalysisItem[];   // Per-keyword analysis
  overallScore: number;              // 0-100
  topKeywords: TopKeyword[];         // Most frequent words
  recommendations: string[];         // Action items
  metrics: KeywordMetrics;           // Word counts
};

type KeywordAnalysisItem = {
  keyword: string;
  count: number;
  density: number;                   // Percentage
  locations: KeywordLocation[];      // Where found
  status: "optimal" | "low" | "high" | "missing";
  suggestion?: string;
};
```

---

### Utility Functions

Low-level utilities exported for advanced usage:

```typescript
import {
  calculateFleschKincaid,  // Get reading ease and grade level
  countSyllables,          // Count syllables in a word
  getReadabilityLevel,     // Convert score to description
  extractWords,            // Split content into words
  extractParagraphs,       // Split content into paragraphs
  extractHeadings,         // Extract headings with levels
  findOccurrences,         // Find regex matches with context
  hasQuickAnswerPattern,   // Check for quick answer patterns
  hasConclusionSection,    // Check for conclusion heading
  clampScore,              // Clamp value to 0-100
} from "@f-o-t/content-analysis";

// Examples
const { readingEase, gradeLevel } = calculateFleschKincaid(text);
const syllables = countSyllables("comprehensive"); // 4
const level = getReadabilityLevel(65); // "Standard (8th-9th grade)"
const headings = extractHeadings(content);
// [{ level: 2, text: "Introduction", index: 0 }, ...]
```

## Types

All types are exported from the main package and from `@f-o-t/content-analysis/types`:

```typescript
import type {
  // Input types
  AnalysisInput,
  SeoInput,
  KeywordInput,

  // Result types
  ContentAnalysisResult,
  SeoResult,
  ReadabilityResult,
  StructureResult,
  BadPatternResult,
  KeywordAnalysisResult,

  // Detail types
  SeoIssue,
  SeoMetrics,
  ReadabilityMetrics,
  StructureIssue,
  ContentStructure,
  BadPattern,
  KeywordAnalysisItem,
  TopKeyword,

  // Enums/unions
  Severity,
  TargetAudience,
  ContentType,
  BadPatternType,
  KeywordStatus,
} from "@f-o-t/content-analysis";
```

## License

MIT
