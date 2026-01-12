# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-01-12

### Added

#### Combined Analysis
- `analyzeContent()` - Comprehensive content analysis running all analyzers
  - SEO analysis
  - Readability scoring
  - Structure validation
  - Bad pattern detection
  - Keyword analysis
  - Returns combined results with timestamp

#### SEO Analysis
- `analyzeSeo()` - Search engine optimization analysis
  - Title length validation (50-60 characters optimal)
  - Keyword presence in title
  - Meta description validation (150-160 characters optimal)
  - Heading structure validation (no H1 in content body)
  - H2 heading frequency (1 per 200-300 words)
  - Keywords in H2 headings
  - Content length requirements (600-1000+ words)
  - Internal and external link detection
  - Image detection and alt text
  - Quick answer detection in first 100 words
  - Keyword in first paragraph check
  - Keyword density analysis (1-2% optimal)
  - Conclusion section detection
  - Score calculation (0-100)
  - Issue reporting with severity levels
  - Actionable recommendations

#### Readability Analysis
- `analyzeReadability()` - Flesch-Kincaid readability analysis
  - Flesch-Kincaid Reading Ease score (0-100)
  - Flesch-Kincaid Grade Level
  - Human-readable readability level
  - Target audience support:
    - `general` (60-70 reading ease)
    - `technical` (40-60 reading ease)
    - `academic` (30-50 reading ease)
    - `casual` (70-80 reading ease)
  - On-target assessment
  - Improvement suggestions
  - Detailed metrics:
    - Sentence count
    - Word count
    - Average words per sentence
    - Average syllables per word
    - Complex word count and percentage

#### Structure Analysis
- `analyzeStructure()` - Content structure validation
  - H1 heading detection in content body (error)
  - Heading hierarchy validation (no skipped levels)
  - Quick answer pattern detection
  - Paragraph length analysis (max 4 sentences recommended)
  - H2 frequency validation (1 per 250 words)
  - Table of contents detection for long content
  - Table detection
  - Conclusion section detection
  - Content type-specific checks:
    - `how-to`: Numbered steps required
    - `comparison`: Comparison tables expected
    - `listicle`: Multiple list items expected
  - Score calculation (0-100)

#### Bad Pattern Detection
- `analyzeBadPatterns()` - Problematic pattern detection
  - Word count mentions in content
  - Word count claims in title
  - Meta-commentary ("In this article...", "As mentioned above...")
  - Engagement begging ("Don't forget to like and subscribe")
  - Endless introductions (over 150 words)
  - Vague instructions ("Configure appropriately")
  - Clickbait markers ("You won't believe...")
  - Excessive punctuation (!!!, ?!?)
  - Filler phrases ("Without further ado", "At the end of the day")
  - Over-formatting (consecutive bold/italic)
  - Walls of text (paragraphs over 100 words)
  - Keyword stuffing (phrase density over 3%)
  - Multi-language support (English and Portuguese patterns)

#### Keyword Analysis
- `analyzeKeywords()` - Keyword usage analysis
  - Per-keyword analysis:
    - Count and density
    - Location tracking (title, headings, first/last 100 words)
    - Status classification (optimal, low, high, missing)
    - Individual suggestions
  - Overall score calculation (0-100)
  - Top 10 most frequent words in content
  - Recommendations for missing, low, and overused keywords
  - Metrics (total words, unique words, average density)

#### Utility Functions
- `calculateFleschKincaid()` - Calculate reading ease and grade level
- `countSyllables()` - Count syllables in a word
- `getReadabilityLevel()` - Convert score to human-readable description
- `extractWords()` - Extract words from content
- `extractParagraphs()` - Extract paragraphs from content
- `extractHeadings()` - Extract headings with level, text, and index
- `findOccurrences()` - Find regex matches with surrounding context
- `hasQuickAnswerPattern()` - Detect quick answer patterns
- `hasConclusionSection()` - Detect conclusion headings
- `clampScore()` - Clamp value to 0-100 range

#### Type System
- Full TypeScript support with exported types
- Separate types export (`@f-o-t/content-analysis/types`)
- Input types: `AnalysisInput`, `SeoInput`, `KeywordInput`
- Result types: `ContentAnalysisResult`, `SeoResult`, `ReadabilityResult`, `StructureResult`, `BadPatternResult`, `KeywordAnalysisResult`
- Detail types: `SeoIssue`, `SeoMetrics`, `ReadabilityMetrics`, `StructureIssue`, `ContentStructure`, `BadPattern`, `KeywordAnalysisItem`, `TopKeyword`
- Union types: `Severity`, `TargetAudience`, `ContentType`, `BadPatternType`, `KeywordStatus`, `SeoIssueType`, `KeywordLocationType`
