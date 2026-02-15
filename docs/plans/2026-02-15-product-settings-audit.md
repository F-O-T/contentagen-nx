# Product Settings Configuration Audit & Plan

**Date**: 2026-02-15
**Status**: Planning
**Context**: Audit existing product configuration pages and propose proper settings based on actual app features

---

## Executive Summary

The current product settings pages (`content.tsx`, `forms.tsx`, `ai-agents.tsx`) are **non-functional UI mocks** with configurations that are:
- ❌ Not stored in the database
- ❌ Not backed by oRPC procedures
- ❌ Mix project-level and organization-level concerns
- ⚠️ Include settings that don't align with actual database schemas
- ⚠️ Miss critical settings that DO exist in the schemas

This plan proposes a complete redesign based on the app's actual features and database structure.

---

## Current State Analysis

### 1. **Content Product Settings** (❌ Problematic)

#### Current Mock Settings:
```typescript
// Padrões de Conteúdo
- Idioma padrão: "Português (BR)"           // ❌ NOT in schema
- Agente IA padrão: "Nenhum selecionado"    // ✅ Valid (writerId)
- Revisão obrigatória: Toggle               // ❌ NOT in schema
- Limite de versões: "10"                   // ❌ NOT in schema

// SEO
- Template de meta title: "{{title}} | {{brand}}"       // ⚠️ Partially valid
- Template de meta description: "{{description}}"       // ⚠️ Partially valid
```

#### Actual `content` Schema Fields:
```typescript
{
  id, writerId, organizationId, teamId, createdByMemberId,
  body: text,
  imageUrl: text,
  status: enum('draft', 'published', 'archived'),
  shareStatus: enum('private', 'shared'),
  draftOrigin: enum('manual', 'ai_generated'),
  meta: {
    title, description, slug,
    keywords: string[],
    sources: string[]
  },
  request: {
    description,
    layout: enum('tutorial', 'article', 'changelog')
  },
  stats: { qualityScore, readTimeMinutes, wordsCount, reasonOfTheRating }
}
```

#### What Makes Sense vs Doesn't:
| Setting | Status | Reason |
|---------|--------|--------|
| Idioma padrão | ❌ Remove | No `language` field in schema; content is Portuguese by default |
| Agente IA padrão | ✅ Keep | Maps to `writerId` (FK to writer table) |
| Revisão obrigatória | ⚠️ Maybe | Could be workflow setting, but not in current schema |
| Limite de versões | ❌ Remove | No versioning system in schema |
| Meta templates | ⚠️ Redesign | `meta.title` and `meta.description` exist, but templates should be organization-level |

---

### 2. **Forms Product Settings** (⚠️ Mixed Quality)

#### Current Mock Settings:
```typescript
- Mensagem de sucesso padrão: "Obrigado..."         // ✅ Valid
- Email de notificação: "notificacoes@..."          // ✅ Valid
- Proteção anti-spam: Toggle                        // ❌ NOT in schema
- Double opt-in: Toggle                             // ❌ NOT in schema
- Retenção de dados: "90 dias"                      // ❌ NOT in schema
```

#### Actual `forms` Schema Fields:
```typescript
{
  id, organizationId, teamId,
  name: text,
  description: text,
  fields: Array<{
    id, type, label, placeholder, required, options
  }>,
  settings: {
    successMessage?: string,           // ✅ Exists!
    redirectUrl?: string,              // ✅ Exists!
    sendEmailNotification?: boolean,   // ✅ Exists!
    emailRecipients?: string[]         // ✅ Exists!
  },
  isActive: boolean
}
```

#### What Makes Sense vs Doesn't:
| Setting | Status | Reason |
|---------|--------|--------|
| Mensagem de sucesso padrão | ✅ Keep | Maps to `settings.successMessage` |
| Email de notificação | ✅ Redesign | Maps to `settings.emailRecipients[]` (should allow multiple) |
| Proteção anti-spam | ❌ Remove | Not in schema; handled by Arcjet at API level |
| Double opt-in | ❌ Remove | Not in schema; not implemented |
| Retenção de dados | ❌ Remove | No TTL/retention system in schema |

**New Settings to Add** (from schema):
- ✅ **Redirect URL padrão**: `settings.redirectUrl`
- ✅ **Enviar notificação por email**: `settings.sendEmailNotification` (boolean toggle)

---

### 3. **AI Agents Settings** (⚠️ Wrong Scope, Needs Redesign)

#### Current Mock Settings:
```typescript
- Modelo padrão: "GPT-4o"                           // ⚠️ Should be project-level default
- Nível de criatividade: "Balanceado"               // ❌ Per-writer config, not here
- Provedores de pesquisa: "Tavily, Exa"             // ❌ Package-level config
- Limite de tokens por requisição: "4.096"          // ⚠️ Could be project limit
```

#### Actual Mastra Agents System (from `@packages/agents`):

**8 Agents Available**:
1. **Orchestrator** - Coordinates delegation to specialists
2. **Writer** - Blog post creation/editing (41 tools)
3. **Planner** - Content strategy/outlines (4 tools)
4. **Researcher** - Topic research/SERP analysis (10 tools)
5. **SEO Auditor** - SEO quality analysis (13 tools)
6. **Reviewer** - Content quality review (6 tools)
7. **FIM** - Fill-in-middle completion (prompt-only)
8. **Inline Edit** - Text transformations (prompt-only)

**Available Models** (from `@packages/agents/src/models.ts`):
```typescript
- openrouter/x-ai/grok-4.1-fast           // DEFAULT for content agents
- openrouter/mistralai/mistral-small-creative  // DEFAULT for FIM/edits
- openrouter/minimax/minimax-m2.1         // Alternative
```

**Request Context** (configurable per-request):
```typescript
{
  userId: string,              // Required
  brandId?: string,            // Optional brand tracking
  writerId?: string,           // Multi-writer scenarios
  model?: ModelId,             // Override model (Orchestrator only)
  language?: "pt-BR" | "en-US" | "es",  // Default: pt-BR
  writerInstructions?: InstructionMemoryItem[]  // Custom memories
}
```

**RAG Configuration** (from `@packages/agents/src/mastra/rag/`):
- Embedding: `openai/text-embedding-3-small` (1536 dims)
- Max results: 10
- Min score: 0.5 (configurable per query)
- Indexes: `content_metadata`, `content_chunks`

#### What Makes Sense vs Doesn't:
| Setting | Status | Reason |
|---------|--------|--------|
| Modelo padrão | ✅ Keep | Valid project-level default (select from 3 models) |
| Nível de criatividade | ❌ Remove | Per-writer `personaConfig`, not global |
| Provedores de pesquisa | ❌ Remove | Hardcoded in tools, not configurable |
| Limite de tokens | ⚠️ Redesign | Valid as max chat tokens or reasoning steps |

**New Settings to Add**:
- ✅ **Idioma padrão**: Default language for all agents (pt-BR/en-US/es)
- ✅ **Modelo para conteúdo**: Default for Writer/Planner/Researcher/Auditor
- ✅ **Modelo para edição rápida**: Default for FIM/Inline Edit
- ✅ **RAG configuração**: Max results, min score, enable/disable
- ✅ **Limites**: Max chat tokens, max reasoning steps

**This page SHOULD exist** with proper settings tied to Mastra's actual configuration options.

---

## Proposed New Architecture

### Database Schema Addition

Create a new table for project-level product defaults:

```typescript
// packages/database/src/schemas/product-settings.ts
export const productSettings = pgTable("product_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  teamId: uuid("team_id")
    .notNull()
    .references(() => team.id, { onDelete: "cascade" })
    .unique(), // One settings record per team

  // Content Product Defaults
  contentDefaults: jsonb("content_defaults").$type<{
    defaultWriterId?: string;           // FK to writer.id
    defaultLayout?: "tutorial" | "article" | "changelog";
    autoGenerateSlug?: boolean;
    defaultShareStatus?: "private" | "shared";
  }>(),

  // Forms Product Defaults
  formsDefaults: jsonb("forms_defaults").$type<{
    successMessage?: string;
    redirectUrl?: string;
    sendEmailNotification?: boolean;
    emailRecipients?: string[];
  }>(),

  // AI Agents Product Defaults
  aiDefaults: jsonb("ai_defaults").$type<{
    // Language & Models
    defaultLanguage?: "pt-BR" | "en-US" | "es";
    contentModel?: "openrouter/x-ai/grok-4.1-fast" | "openrouter/minimax/minimax-m2.1";
    editModel?: "openrouter/mistralai/mistral-small-creative" | "openrouter/x-ai/grok-4.1-fast";

    // Web Search Configuration (Perplexity-style)
    searchDepth?: "basic" | "advanced";                    // default: basic
    searchMaxResults?: number;                              // 1-20, default 5
    includeSearchAnswer?: boolean;                          // synthesize answer, default false
    searchTimeRange?: "day" | "week" | "month" | "year" | "all";  // default: all
    preferredSearchProvider?: "tavily" | "exa" | "firecrawl";  // auto-fallback
    requireAuthoritativeSources?: boolean;                  // filter .gov/.edu/.org
    minCredibility?: "high" | "medium" | "low";            // fact-finder threshold

    // RAG Configuration (Internal Content Search)
    ragMaxResults?: number;      // 1-20, default 5
    ragMinScore?: number;         // 0.0-1.0, default 0.5
    ragEnabled?: boolean;         // default true

    // Limits
    maxChatTokens?: number;       // budget per chat session
    maxReasoningSteps?: number;   // limit tool calls
  }>(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});
```

---

## Revised Settings Pages

### 1. **Content Product Settings** ✅

**Route**: `/$slug/$teamId/settings/project/products/content`

#### Section 1: Defaults de Criação
| Setting | Type | Maps To | Description |
|---------|------|---------|-------------|
| Agente IA padrão | Select | `contentDefaults.defaultWriterId` | Writer usado ao criar novo conteúdo |
| Layout padrão | Select | `contentDefaults.defaultLayout` | tutorial / article / changelog |
| Visibilidade padrão | Select | `contentDefaults.defaultShareStatus` | private / shared |
| Gerar slug automaticamente | Toggle | `contentDefaults.autoGenerateSlug` | Auto-gera slug do título |

**UI Pattern**: Follow `organization/general.tsx` with sections:
- `DefaultWriterSection` (select writer via orpc.writer.getAll)
- `DefaultLayoutSection` (radio group)
- `DefaultShareStatusSection` (radio group)
- `AutoSlugSection` (switch)

---

### 2. **Forms Product Settings** ✅ (Early Access)

**Route**: `/$slug/$teamId/settings/project/products/forms`
**Early Access Gate**: Requires `forms-beta` flag

#### Section 1: Configurações Padrão
| Setting | Type | Maps To | Description |
|---------|------|---------|-------------|
| Mensagem de sucesso | Input | `formsDefaults.successMessage` | Default: "Obrigado por enviar!" |
| URL de redirecionamento | Input | `formsDefaults.redirectUrl` | Optional redirect after submit |
| Notificar por email | Toggle | `formsDefaults.sendEmailNotification` | Send email on new submission |
| Destinatários de email | Multi-input | `formsDefaults.emailRecipients[]` | Array of emails |

**UI Pattern**: Follow `organization/general.tsx` with sections:
- `SuccessMessageSection` (input + save button)
- `RedirectUrlSection` (input with validation)
- `EmailNotificationSection` (switch + conditional multi-email input)

**Note**: Individual forms can override these defaults in `form.settings`.

---

### 3. **AI Agents Product Settings** ✅ REDESIGN

**Route**: `/$slug/$teamId/settings/project/products/ai-agents`

**Context**: Based on Mastra agents system (`@packages/agents`)

#### What's Actually Configurable (From Mastra):

**Agent System** (8 agents):
- Orchestrator, Writer, Planner, Researcher, SEO Auditor, Reviewer, FIM, Inline Edit
- **Models**: 3 available via OpenRouter
  - `openrouter/x-ai/grok-4.1-fast` (default for all content agents)
  - `openrouter/mistralai/mistral-small-creative` (FIM/inline edits)
  - `openrouter/minimax/minimax-m2.1` (alternative)
- **Language Support**: pt-BR (default), en-US, es
- **Request Context**: userId, brandId, writerId, model, language, writerInstructions

#### Section 1: Configurações Padrão de Agentes
| Setting | Type | Maps To | Description |
|---------|------|---------|-------------|
| Idioma padrão | Select | `aiDefaults.defaultLanguage` | pt-BR / en-US / es |
| Modelo para conteúdo | Select | `aiDefaults.contentModel` | Model for Writer/Planner/Researcher |
| Modelo para edição rápida | Select | `aiDefaults.editModel` | Model for FIM/Inline Edit |

#### Section 2: Configurações de Busca Web (Perplexity-style)
| Setting | Type | Maps To | Description |
|---------|------|---------|-------------|
| Profundidade de busca padrão | Select | `aiDefaults.searchDepth` | basic (rápido) / advanced (profundo) |
| Máximo de resultados por busca | Number | `aiDefaults.searchMaxResults` | 1-20, default 5 |
| Incluir resposta sintetizada | Toggle | `aiDefaults.includeSearchAnswer` | LLM synthesizes answer from sources |
| Filtro de atualidade | Select | `aiDefaults.searchTimeRange` | day / week / month / year / all |
| Provedor preferencial | Select | `aiDefaults.preferredSearchProvider` | Tavily / Exa / Firecrawl (auto-fallback) |
| Exigir fontes autorizadas | Toggle | `aiDefaults.requireAuthoritativeSources` | Only .gov, .edu, .org + authoritative domains |
| Nível mínimo de credibilidade | Select | `aiDefaults.minCredibility` | high / medium / low (for fact-finder) |

#### Section 3: Configurações de RAG (Busca em Conteúdo Anterior)
| Setting | Type | Maps To | Description |
|---------|------|---------|-------------|
| Número máximo de resultados | Number | `aiDefaults.ragMaxResults` | 1-20, default 5 |
| Score mínimo de similaridade | Number | `aiDefaults.ragMinScore` | 0.0-1.0, default 0.5 |
| Habilitar RAG | Toggle | `aiDefaults.ragEnabled` | Enable/disable content search |

#### Section 4: Limites e Custos
| Setting | Type | Maps To | Description |
|---------|------|---------|-------------|
| Máximo de tokens por chat | Number | `aiDefaults.maxChatTokens` | Token budget per chat session |
| Máximo de passos de raciocínio | Number | `aiDefaults.maxReasoningSteps` | Limit agent tool calls |

**UI Pattern**: Follow `organization/general.tsx` with sections:
- `DefaultLanguageSection` (select with flag icons)
- `ModelSelectionSection` (two selects: content model + edit model with descriptions)
- `WebSearchConfigSection` (Perplexity-style search settings)
  - Search depth select (basic/advanced) with speed indicators
  - Max results slider (1-20)
  - Include answer toggle + explanation
  - Time range select (recent/all time)
  - Provider preference dropdown
  - Authoritative sources toggle + domain list preview
  - Credibility filter select (high/medium/low)
- `RagConfigSection` (internal content search settings)
  - Max results number input
  - Min score slider with live preview
  - Enable RAG toggle
- `LimitsSection` (cost management)
  - Max tokens input with cost estimate
  - Max reasoning steps input with warning

**Database Schema Addition**:
```typescript
aiDefaults: jsonb("ai_defaults").$type<{
  defaultLanguage?: "pt-BR" | "en-US" | "es";
  contentModel?: ModelId;
  editModel?: ModelId;
  ragMaxResults?: number;
  ragMinScore?: number;
  ragEnabled?: boolean;
  maxChatTokens?: number;
  maxReasoningSteps?: number;
}>()
```

**Note**: Individual writer configurations (tone, voice, complexity, brand terms) are managed separately at `/$slug/$teamId/writers` and are NOT project-level defaults.

---

## Implementation Plan

### Phase 1: Database & Backend (2-3 hours)

1. **Create `product-settings` table**
   - [ ] Add schema to `packages/database/src/schemas/product-settings.ts`
   - [ ] Run `bun run db:push`
   - [ ] Add to `packages/database/src/index.ts` exports

2. **Create repository**
   - [ ] `packages/database/src/repositories/product-settings-repository.ts`
   - [ ] `getProductSettings(db, teamId)`
   - [ ] `updateContentDefaults(db, teamId, data)`
   - [ ] `updateFormsDefaults(db, teamId, data)`
   - [ ] `updateAiDefaults(db, teamId, data)`

3. **Create oRPC router**
   - [ ] `apps/web/src/integrations/orpc/router/product-settings.ts`
   - [ ] `getSettings` (query) - returns settings for current team
   - [ ] `updateContentDefaults` (mutation)
   - [ ] `updateFormsDefaults` (mutation)
   - [ ] `updateAiDefaults` (mutation)
   - [ ] Export from `apps/web/src/integrations/orpc/router/index.ts`

### Phase 2: Frontend - Content Settings (3-4 hours)

4. **Refactor `content.tsx` page**
   - [ ] Add `useSuspenseQuery` for settings
   - [ ] Create `DefaultWriterSection` component
     - [ ] Fetch writers via `orpc.writer.getAll`
     - [ ] Select dropdown with current writer
     - [ ] Save button with mutation
   - [ ] Create `DefaultLayoutSection` component
     - [ ] Radio group: tutorial / article / changelog
     - [ ] Save button with mutation
   - [ ] Create `DefaultShareStatusSection` component
     - [ ] Radio group: private / shared
     - [ ] Save button with mutation
   - [ ] Create `AutoSlugSection` component
     - [ ] Switch with inline save
   - [ ] Add error boundary
   - [ ] Add skeleton loader
   - [ ] Remove SEO templates section (not project-level)

### Phase 3: Frontend - Forms Settings (2-3 hours)

5. **Refactor `forms.tsx` page**
   - [ ] Add early access gate check at route level
   - [ ] Add `useSuspenseQuery` for settings
   - [ ] Create `SuccessMessageSection` component
     - [ ] Textarea input with character counter
     - [ ] Save button with mutation
   - [ ] Create `RedirectUrlSection` component
     - [ ] URL input with validation
     - [ ] Optional toggle + conditional input
     - [ ] Save button with mutation
   - [ ] Create `EmailNotificationSection` component
     - [ ] Master toggle: `sendEmailNotification`
     - [ ] Conditional multi-email input: `emailRecipients[]`
     - [ ] Add/remove email fields
     - [ ] Email validation
     - [ ] Save button with mutation
   - [ ] Add error boundary
   - [ ] Add skeleton loader
   - [ ] Remove anti-spam/double opt-in/retention (not in schema)

### Phase 4: Frontend - AI Agents Settings (3-4 hours)

6. **Refactor `ai-agents.tsx` page**
   - [ ] Add `useSuspenseQuery` for settings
   - [ ] Import available models from `@packages/agents/models`
   - [ ] Create `DefaultLanguageSection` component
     - [ ] Select dropdown: pt-BR / en-US / es with flag icons
     - [ ] Save button with mutation
   - [ ] Create `ModelSelectionSection` component
     - [ ] Content model select (Grok 4.1 / MiniMax M2.1)
     - [ ] Edit model select (Mistral Creative / Grok 4.1)
     - [ ] Show model descriptions/use cases
     - [ ] Save button with mutation
   - [ ] Create `WebSearchConfigSection` component (Perplexity-style)
     - [ ] Search depth select (basic/advanced) with speed badges
     - [ ] Max results slider (1-20) with range indicator
     - [ ] Include answer toggle with explanation tooltip
     - [ ] Time range select (day/week/month/year/all)
     - [ ] Provider preference dropdown (Tavily/Exa/Firecrawl)
     - [ ] Authoritative sources toggle + expandable domain list
     - [ ] Credibility filter select (high/medium/low)
     - [ ] Save button with mutation
   - [ ] Create `RagConfigSection` component
     - [ ] Max results number input (1-20)
     - [ ] Min score slider (0.0-1.0) with live preview
     - [ ] Enable RAG toggle
     - [ ] Save button with mutation
   - [ ] Create `LimitsSection` component
     - [ ] Max chat tokens input with cost estimate
     - [ ] Max reasoning steps input with warning
     - [ ] Help text explaining impact
     - [ ] Save button with mutation
   - [ ] Add error boundary
   - [ ] Add skeleton loader

### Phase 5: Cleanup & Navigation (1 hour)

7. **Update settings navigation**
   - [ ] Add early access filter for Forms in `settings-nav-items.ts`
   - [ ] Test that Forms settings only show when enrolled in `forms-beta`

8. **Fix duplicate tasks**
   - [ ] Remove duplicate `embed_form` and `view_submission` from `task-definitions.ts`

9. **Update agent usage**
   - [ ] Modify `apps/web/src/integrations/orpc/router/agent.ts` to use product settings
   - [ ] Pass `aiDefaults.defaultLanguage` to createRequestContext
   - [ ] Pass `aiDefaults.contentModel` or `aiDefaults.editModel` based on agent type
   - [ ] Apply RAG settings when calling RAG tools

### Phase 6: Testing & Verification (2-3 hours)

10. **Manual testing - Content Settings**
   - [ ] Create new team without settings → defaults to null
   - [ ] Update each setting → persists to DB
   - [ ] Verify settings load correctly on page refresh
   - [ ] Create new content → uses default writer/layout/shareStatus
   - [ ] Default writer deleted → shows "None selected"

11. **Manual testing - Forms Settings**
   - [ ] Test early access gate (Forms settings hidden without `forms-beta`)
   - [ ] Create new form → uses default success message/emails
   - [ ] Multi-email input → add/remove emails
   - [ ] Invalid email in recipients → validation error

12. **Manual testing - AI Agents Settings**
   - [ ] Change language → chat responds in selected language
   - [ ] Change content model → new chats use selected model
   - [ ] Change edit model → FIM/inline edits use selected model
   - [ ] **Web Search Config:**
     - [ ] Search depth "advanced" → slower but more thorough results
     - [ ] Search max results 10 → returns 10 sources
     - [ ] Include answer enabled → agent synthesizes answer from sources
     - [ ] Time range "week" → only recent results
     - [ ] Preferred provider "Tavily" → uses Tavily first, fallback to others
     - [ ] Authoritative sources enabled → only .gov/.edu/.org domains
     - [ ] Min credibility "high" → fact-finder filters low-credibility sources
   - [ ] **RAG Config:**
     - [ ] RAG disabled → searchPreviousContent tool not called
     - [ ] RAG max results → query returns correct limit
     - [ ] RAG min score → filters low-similarity results
   - [ ] **Limits:**
     - [ ] Max reasoning steps → agent stops at limit

13. **Edge cases**
   - [ ] Concurrent updates → last write wins (acceptable)
   - [ ] Invalid model ID → validation error
   - [ ] RAG score out of range (>1.0) → validation error

---

## Success Criteria

✅ All product settings pages follow `organization/general.tsx` pattern
✅ Settings persist to `product_settings` table
✅ Forms settings only visible when enrolled in `forms-beta`
✅ AI Agents page redesigned with proper Mastra-based settings
✅ All buttons functional with proper loading/error states
✅ No duplicate tasks in `task-definitions.ts`
✅ Settings used as defaults when creating new content/forms
✅ Agent invocations use project-level AI defaults (language, model, RAG)

---

## Technical Decisions

### Why JSONB columns instead of separate tables?
- Settings are simple key-value pairs, not relational data
- No querying needed on individual settings
- Easier schema evolution (add new defaults without migrations)
- One settings record per team (enforced by unique constraint)

### Why separate sections instead of one form?
- Follows Contentta's pattern (see `organization/general.tsx`)
- Better UX: save individual changes without full form validation
- Clearer loading/error states per section
- Easier to add new sections later

### Why keep AI Agents page (redesigned)?
- **Clear separation**: Project defaults (model, language) vs writer personas (tone, voice)
- **Mastra integration**: Exposes actual configurable options from `@packages/agents`
- **User control**: Users should control which model/language their team uses by default
- **Cost management**: Max tokens and reasoning steps prevent runaway costs
- **RAG tuning**: Team-specific relevance thresholds improve search quality

---

## Migration Notes

**No data migration needed** - these are new settings with sensible defaults:
- `contentDefaults` → `null` (form shows "None selected")
- `formsDefaults.successMessage` → `null` (falls back to hardcoded default)
- `formsDefaults.emailRecipients` → `[]` (no notifications by default)
- `aiDefaults.defaultLanguage` → `"pt-BR"` (matches current hardcoded default)
- `aiDefaults.contentModel` → `"openrouter/x-ai/grok-4.1-fast"` (current default)
- `aiDefaults.editModel` → `"openrouter/mistralai/mistral-small-creative"` (current default)
- `aiDefaults.searchDepth` → `"basic"` (current default in web-search-tool)
- `aiDefaults.searchMaxResults` → `5` (current default)
- `aiDefaults.includeSearchAnswer` → `false` (current default)
- `aiDefaults.searchTimeRange` → `"all"` (no filtering)
- `aiDefaults.preferredSearchProvider` → `null` (auto-select)
- `aiDefaults.requireAuthoritativeSources` → `false` (no filtering)
- `aiDefaults.minCredibility` → `"low"` (accept all sources)
- `aiDefaults.ragEnabled` → `true` (current behavior)
- `aiDefaults.ragMaxResults` → `5` (current RAG default)
- `aiDefaults.ragMinScore` → `0.5` (current RAG default)

**Backward compatibility**:
- Individual forms' `settings` field overrides team defaults
- Writers' `personaConfig` remains unchanged
- Content creation flow works with or without defaults
- Agent invocations fall back to hardcoded defaults if settings not configured

---

## Open Questions

1. **SEO Templates**: Should these be organization-level settings instead of project-level?
   - **Recommendation**: Yes. Create `organization_settings` table with `seoDefaults` JSONB.
   - Most orgs use same title/description pattern across all projects.

2. **Content Versioning**: Should we add version history to the roadmap?
   - **Recommendation**: Separate epic. Would require:
     - `content_versions` table
     - Versioning service in `@packages/database`
     - Restore/compare UI
   - Not part of this plan.

3. **Workflow settings** (approval required, auto-publish, etc.)?
   - **Recommendation**: Separate feature. Would require:
     - Workflow state machine
     - Role-based permissions
     - Approval flow UI
   - Not part of this plan.

---

## Estimated Timeline

- **Phase 1 (Backend)**: 2-3 hours
- **Phase 2 (Content)**: 3-4 hours
- **Phase 3 (Forms)**: 2-3 hours
- **Phase 4 (AI Agents)**: 3-4 hours
- **Phase 5 (Cleanup)**: 1 hour
- **Phase 6 (Testing)**: 2-3 hours

**Total**: 13-18 hours (~2-2.5 days)

---

## Next Steps

1. Review this plan with team/stakeholders
2. Confirm database schema design
3. Decide on SEO templates placement (org vs project)
4. Execute phases sequentially (backend → frontend → cleanup)
5. Document new settings in user-facing docs
