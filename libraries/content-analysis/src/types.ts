/**
 * Content Analysis Types
 * All type definitions for SEO, readability, structure, and pattern analysis
 */

// ============================================================================
// SEO Types
// ============================================================================

export type SeoIssueType =
   | "title"
   | "meta_description"
   | "headings"
   | "keyword_density"
   | "content_length"
   | "readability"
   | "links"
   | "images"
   | "quick_answer"
   | "first_paragraph"
   | "heading_keywords"
   | "structure";

export type Severity = "error" | "warning" | "info";

export type SeoIssue = {
   type: SeoIssueType;
   severity: Severity;
   message: string;
   suggestion: string;
};

export type SeoMetrics = {
   wordCount: number;
   headingCount: number;
   paragraphCount: number;
   linkCount: number;
   imageCount: number;
   hasQuickAnswer: boolean;
   keywordInFirstParagraph: boolean;
   keywordDensity?: Record<string, number>;
};

export type SeoResult = {
   score: number;
   issues: SeoIssue[];
   recommendations: string[];
   metrics: SeoMetrics;
};

export type SeoInput = {
   content: string;
   title?: string;
   metaDescription?: string;
   targetKeywords?: string[];
};

// ============================================================================
// Readability Types
// ============================================================================

export type TargetAudience = "general" | "technical" | "academic" | "casual";

export type ReadabilityMetrics = {
   sentenceCount: number;
   wordCount: number;
   avgWordsPerSentence: number;
   avgSyllablesPerWord: number;
   complexWordCount: number;
   complexWordPercentage: number;
};

export type TargetScore = {
   min: number;
   max: number;
   description: string;
};

export type ReadabilityResult = {
   fleschKincaidReadingEase: number;
   fleschKincaidGradeLevel: number;
   readabilityLevel: string;
   targetScore: TargetScore;
   isOnTarget: boolean;
   suggestions: string[];
   metrics: ReadabilityMetrics;
};

// ============================================================================
// Structure Types
// ============================================================================

export type ContentType =
   | "how-to"
   | "comparison"
   | "explainer"
   | "listicle"
   | "general";

export type StructureIssue = {
   type: string;
   severity: Severity;
   message: string;
   suggestion: string;
};

export type ContentStructure = {
   hasQuickAnswer: boolean;
   headingHierarchyValid: boolean;
   avgParagraphLength: number;
   hasTableOfContents: boolean;
   hasTables: boolean;
   hasConclusion: boolean;
   headingCount: number;
   wordCount: number;
};

export type StructureResult = {
   score: number;
   issues: StructureIssue[];
   structure: ContentStructure;
};

// ============================================================================
// Bad Pattern Types
// ============================================================================

export type BadPatternType =
   | "word_count_mention"
   | "word_count_in_title"
   | "meta_commentary"
   | "engagement_begging"
   | "endless_introduction"
   | "vague_instructions"
   | "clickbait_markers"
   | "filler_phrases"
   | "over_formatting"
   | "wall_of_text"
   | "keyword_stuffing";

export type BadPattern = {
   pattern: string;
   severity: "error" | "warning";
   locations: string[];
   suggestion: string;
};

export type BadPatternResult = {
   hasIssues: boolean;
   issueCount: number;
   patterns: BadPattern[];
};

// ============================================================================
// Keyword Types
// ============================================================================

export type KeywordLocationType =
   | "title"
   | "heading"
   | "paragraph"
   | "first100words"
   | "last100words";

export type KeywordStatus = "optimal" | "low" | "high" | "missing";

export type KeywordLocation = {
   type: KeywordLocationType;
   index?: number;
};

export type KeywordAnalysisItem = {
   keyword: string;
   count: number;
   density: number;
   locations: KeywordLocation[];
   status: KeywordStatus;
   suggestion?: string;
};

export type TopKeyword = {
   keyword: string;
   count: number;
   density: number;
};

export type KeywordMetrics = {
   totalWordCount: number;
   uniqueWordCount: number;
   avgKeywordDensity: number;
};

export type KeywordAnalysisResult = {
   analysis: KeywordAnalysisItem[];
   overallScore: number;
   topKeywords: TopKeyword[];
   recommendations: string[];
   metrics: KeywordMetrics;
};

export type KeywordInput = {
   content: string;
   title?: string;
   targetKeywords: string[];
};

// ============================================================================
// Combined Analysis Types
// ============================================================================

export type ContentAnalysisResult = {
   seo: SeoResult;
   readability: ReadabilityResult;
   structure: StructureResult;
   badPatterns: BadPatternResult;
   keywords: KeywordAnalysisResult | null;
   analyzedAt: string;
};

export type AnalysisInput = {
   content: string;
   title?: string;
   description?: string;
   targetKeywords?: string[];
};
