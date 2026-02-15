# Perplexity-Style Search Configuration

**Date**: 2026-02-15
**Context**: AI Agents product settings now include powerful web search configuration inspired by Perplexity

---

## What Makes This "Perplexity-Level" Search?

### 🎯 **Core Perplexity Features → Your Implementation**

| Perplexity Feature | Your Implementation | User Control |
|-------------------|---------------------|--------------|
| **Multi-source aggregation** | 3 providers (Tavily, Exa, Firecrawl) with auto-fallback | ✅ Preferred provider selection |
| **Deep research mode** | `searchDepth: "basic" \| "advanced"` | ✅ Default depth setting |
| **Citation tracking** | Every search result includes source URL + score | ✅ Built-in (automatic) |
| **Answer synthesis** | `includeAnswer: true` → LLM synthesizes from sources | ✅ Toggle per team |
| **Source quality filtering** | Authoritative domains (.gov/.edu/.org) + credibility scoring | ✅ Require authoritative toggle |
| **Time-based filtering** | `timeRange: day/week/month/year/all` | ✅ Default time range |
| **Fact verification** | `fact-finder-tool` with credibility levels (high/medium/low) | ✅ Min credibility threshold |
| **Multi-step research** | Researcher agent with 10 tools (SERP, content gap, competitor) | ✅ Always available |

---

## Available Search Tools (From `@packages/agents`)

### 1. **Web Search Tool**
**File**: `src/mastra/tools/research/web-search-tool.ts`

**What it does**: General web search with provider fallback

**Configurable by users**:
- `searchDepth`: basic (fast) vs advanced (thorough)
- `maxResults`: 1-20 results
- `preferredProvider`: Tavily / Exa / Firecrawl (auto-fallback if unavailable)

**Example**: "Search for latest Next.js 15 features"
```typescript
{
  query: "Next.js 15 new features",
  maxResults: 10,
  searchDepth: "advanced",
  preferredProvider: "tavily"
}
```

---

### 2. **SERP Analysis Tool**
**File**: `src/mastra/tools/research/serp-analysis-tool.ts`

**What it does**: Analyzes top-ranking content for a keyword

**Returns**:
- Top 10 results with position, title, URL, snippet
- Common patterns: avg title/snippet length, common words, title formats
- Content analysis: word count, headings, key topics (top 3 crawled)
- Recommendations: SEO insights based on what's ranking

**Example**: "Analyze SERP for 'React Server Components'"
```typescript
{
  query: "React Server Components",
  analyzeTopResults: 5  // crawls top 5 for deep analysis
}
```

---

### 3. **Fact Finder Tool** 🔥 **The Perplexity Secret Sauce**
**File**: `src/mastra/tools/research/fact-finder-tool.ts`

**What it does**: Searches for statistics, studies, quotes, examples with **credibility scoring**

**Authoritative Domains** (hardcoded):
- **Statistics**: statista.com, pewresearch.org, census.gov, worldbank.org, who.int, cdc.gov
- **Studies**: nih.gov, ncbi.nlm.nih.gov, nature.com, sciencedirect.com, jstor.org, pubmed.gov
- **Quotes**: forbes.com, hbr.org, bloomberg.com, reuters.com, nytimes.com, wsj.com, economist.com
- **Examples**: github.com, stackoverflow.com, medium.com, dev.to, freecodecamp.org

**Authoritative TLDs**: .gov, .edu, .org

**Credibility Levels**:
- **High**: Authoritative domains + TLDs
- **Medium**: Wikipedia, reputable news/tech (BBC, CNN, Guardian, Ars Technica)
- **Low**: Everything else

**Configurable by users**:
- `factTypes`: statistics / studies / quotes / examples (select multiple)
- `maxFacts`: 3-20 facts
- `minCredibility`: User sets threshold via `aiDefaults.minCredibility`

**Example**: "Find statistics about AI adoption in 2025"
```typescript
{
  topic: "AI adoption 2025",
  factTypes: ["statistics", "studies"],
  maxFacts: 10
}
// Returns: facts sorted by credibility, with citations ready
```

---

### 4. **Web Crawl Tool**
**File**: `src/mastra/tools/research/web-crawl-tool.ts`

**What it does**: Fetches full content from a specific URL (Markdown + HTML + metadata)

**Returns**:
- Full page content in Markdown
- HTML (optional)
- Metadata: description, author, publishedDate, wordCount

**Example**: "Crawl this competitor's blog post"

---

### 5. **Content Gap Tool**
**File**: `src/mastra/tools/research/content-gap-tool.ts`

**What it does**: Identifies topics competitors cover that you don't

**Example**: "What are they writing about that we aren't?"

---

### 6. **Competitor Content Tool**
**File**: `src/mastra/tools/research/competitor-content-tool.ts`

**What it does**: Analyzes competitor content structure, headings, keywords, readability

---

### 7. **Related Keywords Tool**
**File**: `src/mastra/tools/research/related-keywords-tool.ts`

**What it does**: Finds semantically related keywords for SEO

---

### 8. **Research Completeness Tool**
**File**: `src/mastra/tools/research/research-completeness-tool.ts`

**What it does**: Evaluates if research is sufficient for writing

---

## Search Configuration in Product Settings

### **Section 2: Web Search Configuration (Perplexity-style)**

Users can configure:

| Setting | Options | Impact |
|---------|---------|--------|
| **Profundidade de busca padrão** | basic / advanced | Speed vs thoroughness |
| **Máximo de resultados por busca** | 1-20 (default 5) | More sources = better synthesis |
| **Incluir resposta sintetizada** | Toggle | Agent synthesizes answer from multiple sources |
| **Filtro de atualidade** | day / week / month / year / all | Freshness vs depth |
| **Provedor preferencial** | Tavily / Exa / Firecrawl | Speed/quality preferences |
| **Exigir fontes autorizadas** | Toggle | Only .gov/.edu/.org + authoritative |
| **Nível mínimo de credibilidade** | high / medium / low | Fact-finder quality gate |

---

## How It Works (User Flow)

### **Scenario 1: General Research**
User asks: "What are the best practices for React Server Components in 2025?"

1. **Orchestrator** delegates to **Researcher Agent**
2. Researcher uses `webSearchTool`:
   - `searchDepth`: Uses team's default (basic/advanced)
   - `maxResults`: Uses team's default (e.g., 10)
   - `preferredProvider`: Uses team's preference (e.g., Tavily)
   - `searchTimeRange`: Uses team's default (e.g., "month" for recent)
3. Returns 10 sources, agent reads top 3-5 with `webCrawlTool`
4. If `includeSearchAnswer` is enabled, provider synthesizes answer
5. Agent writes response with **citations** for every claim

### **Scenario 2: Fact-Heavy Content**
User asks: "Write about AI adoption statistics in enterprise"

1. **Writer Agent** needs facts
2. Calls `factFinderTool`:
   - `factTypes`: ["statistics", "studies"]
   - `maxFacts`: 10
   - Applies `minCredibility` from team settings (e.g., "high")
3. Tool returns **only high-credibility facts** from:
   - statista.com, pewresearch.org, nih.gov, etc.
4. Agent incorporates facts with **automatic citations**

### **Scenario 3: SEO-Optimized Content**
User asks: "Optimize this post for 'Next.js performance'"

1. **SEO Auditor Agent** analyzes current content
2. Calls `serpAnalysisTool`:
   - Analyzes top 10 ranking pages
   - Extracts common title patterns, keywords, content structure
3. Returns recommendations based on what's actually ranking
4. Agent suggests: title length, headings to add, keywords to include

---

## Key Differences from Generic Search

| Feature | Generic Search | Your Perplexity-Style Search |
|---------|---------------|------------------------------|
| Sources | Single provider, no fallback | 3 providers with auto-fallback |
| Quality | No filtering | Credibility scoring + authoritative domain filtering |
| Depth | One-shot search | Multi-step research (SERP → Crawl → Gap → Competitor) |
| Citations | Manual | Automatic with every fact/claim |
| Synthesis | Just links | Optional LLM-synthesized answers |
| Freshness | No control | User-configurable time ranges |
| Fact-checking | None | Built-in credibility levels |

---

## Configuration Defaults (Sensible Starting Points)

```typescript
// Balanced configuration (recommended for most teams)
aiDefaults: {
  searchDepth: "basic",                    // Fast by default
  searchMaxResults: 5,                     // Enough for synthesis
  includeSearchAnswer: false,              // Manual control
  searchTimeRange: "all",                  // No filtering
  preferredSearchProvider: null,           // Auto-select best
  requireAuthoritativeSources: false,      // Allow all sources
  minCredibility: "low",                   // Accept all facts
}

// Quality-focused configuration (enterprise/research)
aiDefaults: {
  searchDepth: "advanced",                 // Thorough research
  searchMaxResults: 10,                    // More sources
  includeSearchAnswer: true,               // AI synthesis
  searchTimeRange: "month",                // Recent only
  preferredSearchProvider: "tavily",       // Fastest provider
  requireAuthoritativeSources: true,       // .gov/.edu/.org only
  minCredibility: "high",                  // Only authoritative facts
}
```

---

## Implementation Notes

### Phase 4 (AI Agents Settings Page)

**WebSearchConfigSection** Component:
```tsx
<ItemGroup>
  <Item variant="muted">
    <ItemMedia variant="icon">
      <Search className="size-4" />
    </ItemMedia>
    <ItemContent>
      <ItemTitle>Profundidade de busca padrão</ItemTitle>
      <ItemDescription>
        Basic: rápido (2-3s) | Advanced: profundo (5-10s)
      </ItemDescription>
    </ItemContent>
    <ItemActions>
      <Select value={searchDepth} onValueChange={...}>
        <SelectItem value="basic">
          <Badge variant="default">Rápido</Badge> Basic
        </SelectItem>
        <SelectItem value="advanced">
          <Badge variant="secondary">Profundo</Badge> Advanced
        </SelectItem>
      </Select>
    </ItemActions>
  </Item>

  {/* Authoritative sources toggle with expandable domain list */}
  <Item variant="muted">
    <ItemMedia variant="icon">
      <ShieldCheck className="size-4" />
    </ItemMedia>
    <ItemContent>
      <ItemTitle>Exigir fontes autorizadas</ItemTitle>
      <ItemDescription>
        Apenas .gov, .edu, .org + domínios verificados
      </ItemDescription>
      <Collapsible>
        <CollapsibleTrigger>Ver domínios autorizados</CollapsibleTrigger>
        <CollapsibleContent>
          <ul className="text-xs space-y-1">
            <li>statista.com, pewresearch.org, census.gov...</li>
            <li>nih.gov, nature.com, pubmed.gov...</li>
          </ul>
        </CollapsibleContent>
      </Collapsible>
    </ItemContent>
    <ItemActions>
      <Switch checked={requireAuthoritativeSources} />
    </ItemActions>
  </Item>
</ItemGroup>
```

### Phase 5 (Agent Integration)

**Modify `apps/web/src/integrations/orpc/router/agent.ts`**:
```typescript
// In chat streaming handler
const settings = await orpc.productSettings.getSettings({ teamId });

const requestContext = createRequestContext({
  userId,
  language: settings?.aiDefaults?.defaultLanguage ?? "pt-BR",
  model: settings?.aiDefaults?.contentModel ?? "openrouter/x-ai/grok-4.1-fast",
});

// Pass search config to agent tools (via context or tool overrides)
// Tools read from requestContext.get("searchConfig")
requestContext.set("searchConfig", {
  searchDepth: settings?.aiDefaults?.searchDepth ?? "basic",
  maxResults: settings?.aiDefaults?.searchMaxResults ?? 5,
  includeAnswer: settings?.aiDefaults?.includeSearchAnswer ?? false,
  timeRange: settings?.aiDefaults?.searchTimeRange ?? "all",
  preferredProvider: settings?.aiDefaults?.preferredSearchProvider,
  requireAuthoritativeSources: settings?.aiDefaults?.requireAuthoritativeSources ?? false,
  minCredibility: settings?.aiDefaults?.minCredibility ?? "low",
});
```

---

## Success Metrics

After implementation, users can:
- ✅ Control search depth for speed vs quality trade-offs
- ✅ Set default time ranges for fresh vs comprehensive results
- ✅ Choose preferred search providers (with auto-fallback)
- ✅ Enable answer synthesis for Perplexity-style responses
- ✅ Filter for authoritative sources only (.gov/.edu/.org)
- ✅ Set minimum credibility levels for fact-checking
- ✅ Configure per-team defaults instead of global hardcoded values

**Result**: Team-level search behavior matches Perplexity's power while giving users full control.
