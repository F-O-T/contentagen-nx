# Reestruturação do Pacote de Agentes — Plano de Implementação

> **Para Claude:** SUB-SKILL NECESSÁRIA: Use superpowers:executing-plans para implementar este plano tarefa por tarefa.

**Objetivo:** Implementar a reestruturação definida em `2026-02-11-agents-restructure-design.md`

**Arquitetura:** Orchestrator + Sub-agentes + 12 Skills Mastra em pt-BR

**Tech Stack:** Mastra Core 1.2.0, PgVector, Zod, TypeScript

**Design doc:** `docs/plans/2026-02-11-agents-restructure-design.md`

---

## Fase 1: Criar estrutura de skills (sem mudar agentes)

Nenhum agente é alterado nesta fase. Criamos toda a base de skills para que possam ser testadas isoladamente.

### Task 1: Criar diretórios de skills

**Files:**
- Create: `packages/agents/src/skills/` (diretório raiz)
- Create: 12 subdiretórios + references/ onde necessário

**Step 1: Criar a árvore de diretórios**

```bash
mkdir -p packages/agents/src/skills/{edicao-de-conteudo,gestao-de-frontmatter,diretrizes-de-escrita/references,otimizacao-seo/references,otimizacao-geo/references,estrategia-de-conteudo/references,pesquisa-de-conteudo/references,revisao-de-conteudo/references,escrita-humana/references,copywriting-de-conversao/references,conhecimento-rag,gestao-de-citacoes}
```

**Step 2: Verificar a estrutura**

```bash
find packages/agents/src/skills -type d | sort
```

Expected: 24 directories (12 skills + 8 references/ + raiz + edicao-de-conteudo + gestao-de-frontmatter + conhecimento-rag + gestao-de-citacoes)

**Step 3: Commit**

```bash
git add packages/agents/src/skills/
git commit -m "chore(agents): create skill directory structure"
```

---

### Task 2: Escrever skill `edicao-de-conteudo`

**Files:**
- Create: `packages/agents/src/skills/edicao-de-conteudo/SKILL.md`

**Step 1: Escrever SKILL.md**

Conteúdo: migrar TODAS as instruções de get*Instructions() das ferramentas de editor + regras do writer-agent.ts.

**Fontes a compilar:**
- `tools/editor/insert-text-tool.ts` → getInsertTextInstructions()
- `tools/editor/replace-text-tool.ts` → getReplaceTextInstructions()
- `tools/editor/delete-text-tool.ts` → getDeleteTextInstructions()
- `tools/editor/format-text-tool.ts` → getFormatTextInstructions()
- `tools/editor/insert-heading-tool.ts` → getInsertHeadingInstructions()
- `tools/editor/insert-list-tool.ts` → getInsertListInstructions()
- `tools/editor/insert-code-block-tool.ts` → getInsertCodeBlockInstructions()
- `tools/editor/insert-table-tool.ts` → getInsertTableInstructions()
- `tools/editor/insert-image-tool.ts` → getInsertImageInstructions()
- `tools/editor/inject-keywords-tool.ts` → getInjectKeywordsInstructions()
- `tools/editor/add-internal-links-tool.ts` → getAddInternalLinksInstructions()
- `tools/editor/add-external-links-tool.ts` → getAddExternalLinksInstructions()
- `tools/editor/improve-readability-tool.ts` → getImproveReadabilityInstructions()
- `tools/editor/optimize-title-tool.ts` → getOptimizeTitleInstructions()
- `tools/editor/optimize-meta-tool.ts` → getOptimizeMetaInstructions()
- `tools/editor/generate-quick-answer-tool.ts` → getGenerateQuickAnswerInstructions()
- `tools/editor/suggest-images-tool.ts` → getSuggestImagesInstructions()
- writer-agent.ts → TABLE GUIDELINES, MARKDOWN, IMAGES, INTERLEAVED THINKING

**Regra:** Todo o texto de instrução deve ser compilado em pt-BR no SKILL.md. Os parâmetros das ferramentas NÃO precisam ser documentados (Mastra já tem os schemas das tools).

**Step 2: Commit**

```bash
git add packages/agents/src/skills/edicao-de-conteudo/
git commit -m "feat(agents): add edicao-de-conteudo skill"
```

---

### Task 3: Escrever skill `gestao-de-frontmatter`

**Files:**
- Create: `packages/agents/src/skills/gestao-de-frontmatter/SKILL.md`

**Fontes a compilar:**
- `tools/frontmatter/edit-title-tool.ts` → getEditTitleInstructions()
- `tools/frontmatter/edit-description-tool.ts` → getEditDescriptionInstructions()
- `tools/frontmatter/edit-slug-tool.ts` → getEditSlugInstructions()
- `tools/frontmatter/edit-keywords-tool.ts` → getEditKeywordsInstructions()
- writer-agent.ts → FIRST STEPS, KEYWORD USAGE, CRITICAL RULES

**Step 1: Escrever SKILL.md**
**Step 2: Commit**

```bash
git add packages/agents/src/skills/gestao-de-frontmatter/
git commit -m "feat(agents): add gestao-de-frontmatter skill"
```

---

### Task 4: Escrever skill `diretrizes-de-escrita` + 4 references

**Files:**
- Create: `packages/agents/src/skills/diretrizes-de-escrita/SKILL.md`
- Create: `packages/agents/src/skills/diretrizes-de-escrita/references/frameworks-de-conteudo.md`
- Create: `packages/agents/src/skills/diretrizes-de-escrita/references/templates-por-tipo.md`
- Create: `packages/agents/src/skills/diretrizes-de-escrita/references/tecnicas-de-engajamento.md`
- Create: `packages/agents/src/skills/diretrizes-de-escrita/references/formulas-de-titulo.md`

**Fontes a compilar:**
- writer-agent.ts → WRITING PRINCIPLES, ANSWER FIRST, CONTENT STRUCTURES, ENGAGEMENT TECHNIQUES, CONCLUSIONS, QUALITY CHECKLIST, BAD Patterns
- coreyhaines/copywriting → writing style rules, headline formulas, CTA copy, best practices
- anthropics/content-creation → blog post structure, headline/hook formulas, writing best practices
- 1nfsh/technical-blog-writing → 5 post types (Tutorial, Deep Dive, Comparison, Postmortem, Architecture), word counts, developer anti-patterns
- langchain-ai/blog-post → Hook → Context → Main Content → Application → Conclusion
- eddiebe147/blog-post-writer → full creation + enhancement workflows
- sickn33/seo-content-writer → content creation framework, quality standards, E-E-A-T elements
- davila7/content-research-writer → voice preservation, section feedback

**Regra:** SKILL.md max ~200 linhas (conciso). Heavy content vai para references/. Tudo em pt-BR. Focado APENAS em blog posts.

**Step 1: Escrever SKILL.md**
**Step 2: Escrever references/frameworks-de-conteudo.md** (PASTOR, Pirâmide Invertida, Power List, Hub & Spoke)
**Step 3: Escrever references/templates-por-tipo.md** (Tutorial, Deep Dive, Comparação, Estudo de Caso, Listicle, Quick Tip)
**Step 4: Escrever references/tecnicas-de-engajamento.md** (Bucket brigades, pattern interrupts, show don't tell)
**Step 5: Escrever references/formulas-de-titulo.md** (Headline formulas, hook types, power words)
**Step 6: Commit**

```bash
git add packages/agents/src/skills/diretrizes-de-escrita/
git commit -m "feat(agents): add diretrizes-de-escrita skill with references"
```

---

### Task 5: Escrever skill `otimizacao-seo` + 3 references

**Files:**
- Create: `packages/agents/src/skills/otimizacao-seo/SKILL.md`
- Create: `packages/agents/src/skills/otimizacao-seo/references/rubrica-de-pontuacao.md`
- Create: `packages/agents/src/skills/otimizacao-seo/references/sinais-eeat.md`
- Create: `packages/agents/src/skills/otimizacao-seo/references/checklist-seo-completo.md`

**Fontes a compilar:**
- Instruções de TODAS as ferramentas de análise (seoScore, readability, keywordDensity, contentStructure, badPatterns, titleMeta, quickAnswer, imageSeo, linkDensity, duplicateContent, toneAnalysis, citation, originality)
- coreyhaines/seo-audit → audit framework, E-E-A-T, content quality, output format
- addyosmani/seo → on-page SEO, heading structure, image SEO, internal linking
- sickn33/seo-content-writer → keyword density 0.5-1.5%, grade 8-10, E-E-A-T
- dkyazzentwatwa/blog-post-optimizer → scoring model, readability targets

**Step 1-4: Escrever cada arquivo**
**Step 5: Commit**

```bash
git add packages/agents/src/skills/otimizacao-seo/
git commit -m "feat(agents): add otimizacao-seo skill with references"
```

---

### Task 6: Escrever skill `otimizacao-geo` + 4 references

**Files:**
- Create: `packages/agents/src/skills/otimizacao-geo/SKILL.md`
- Create: `packages/agents/src/skills/otimizacao-geo/references/9-metodos-princeton.md`
- Create: `packages/agents/src/skills/otimizacao-geo/references/algoritmos-por-plataforma.md`
- Create: `packages/agents/src/skills/otimizacao-geo/references/padroes-aeo-conteudo.md`
- Create: `packages/agents/src/skills/otimizacao-geo/references/templates-schema-jsonld.md`

**Fontes a compilar:**
- resciencelab/seo-geo → SKILL.md completo + geo-research.md + platform-algorithms.md + schema-templates.md
- Suas references existentes: aeo-geo-patterns.md

**Step 1-5: Escrever cada arquivo**
**Step 6: Commit**

```bash
git add packages/agents/src/skills/otimizacao-geo/
git commit -m "feat(agents): add otimizacao-geo skill with references"
```

---

### Task 7: Escrever skill `estrategia-de-conteudo` + 3 references

**Files:**
- Create: `packages/agents/src/skills/estrategia-de-conteudo/SKILL.md`
- Create: `packages/agents/src/skills/estrategia-de-conteudo/references/keywords-por-etapa-do-funil.md`
- Create: `packages/agents/src/skills/estrategia-de-conteudo/references/framework-pillar-cluster.md`
- Create: `packages/agents/src/skills/estrategia-de-conteudo/references/matriz-de-priorizacao.md`

**Fontes a compilar:**
- coreyhaines/content-strategy → searchable vs shareable, content pillars, buyer stage keywords, prioritization
- eddiebe147/blog-post-writer → series planning, content audit
- langchain-ai/blog-post → research-first

**Step 1-4: Escrever cada arquivo**
**Step 5: Commit**

```bash
git add packages/agents/src/skills/estrategia-de-conteudo/
git commit -m "feat(agents): add estrategia-de-conteudo skill with references"
```

---

### Task 8: Escrever skill `pesquisa-de-conteudo` + 1 reference

**Files:**
- Create: `packages/agents/src/skills/pesquisa-de-conteudo/SKILL.md`
- Create: `packages/agents/src/skills/pesquisa-de-conteudo/references/fontes-de-pesquisa.md`

**Fontes a compilar:**
- davila7/content-research-writer → research workflow, citation management
- coreyhaines/content-strategy → competitor analysis, forum research
- Tools de research existentes: web-search, serp-analysis, content-gap, competitor-content, related-keywords, fact-finder, web-crawl, research-completeness

**Step 1-2: Escrever cada arquivo**
**Step 3: Commit**

```bash
git add packages/agents/src/skills/pesquisa-de-conteudo/
git commit -m "feat(agents): add pesquisa-de-conteudo skill with references"
```

---

### Task 9: Escrever skill `revisao-de-conteudo` + 1 reference

**Files:**
- Create: `packages/agents/src/skills/revisao-de-conteudo/SKILL.md`
- Create: `packages/agents/src/skills/revisao-de-conteudo/references/checklist-de-revisao.md`

**Fontes a compilar:**
- davila7/content-research-writer → section feedback, full draft review
- dkyazzentwatwa/blog-post-optimizer → analysis dimensions
- coreyhaines/seo-audit → output format

**Step 1-2: Escrever cada arquivo**
**Step 3: Commit**

```bash
git add packages/agents/src/skills/revisao-de-conteudo/
git commit -m "feat(agents): add revisao-de-conteudo skill with references"
```

---

### Task 10: Escrever skill `escrita-humana` + 1 reference

**Files:**
- Create: `packages/agents/src/skills/escrita-humana/SKILL.md`
- Create: `packages/agents/src/skills/escrita-humana/references/padroes-de-deteccao-ia.md`

**Fontes a compilar:**
- Suas references existentes: ai-writing-detection.md (COMPLETO, traduzido pt-BR)
- 1nfsh/technical-blog-writing → developer anti-patterns
- writer-agent.ts → BAD Patterns to Avoid

**Step 1-2: Escrever cada arquivo**
**Step 3: Commit**

```bash
git add packages/agents/src/skills/escrita-humana/
git commit -m "feat(agents): add escrita-humana skill with references"
```

---

### Task 11: Escrever skill `copywriting-de-conversao` + 3 references

**Files:**
- Create: `packages/agents/src/skills/copywriting-de-conversao/SKILL.md`
- Create: `packages/agents/src/skills/copywriting-de-conversao/references/principios-de-persuasao.md`
- Create: `packages/agents/src/skills/copywriting-de-conversao/references/frameworks-de-cta.md`
- Create: `packages/agents/src/skills/copywriting-de-conversao/references/analise-de-headlines.md`

**Fontes a compilar:**
- Suas references existentes: conversion-psychology.md (COMPLETO, pt-BR)
- coreyhaines/copywriting → CTA guidelines, writing style rules
- anthropics/content-creation → CTA best practices, CTA examples
- dkyazzentwatwa/blog-post-optimizer → power words, headline scoring

**Regra:** Filtrar APENAS para blog posts. Sem landing pages, emails, social media.

**Step 1-4: Escrever cada arquivo**
**Step 5: Commit**

```bash
git add packages/agents/src/skills/copywriting-de-conversao/
git commit -m "feat(agents): add copywriting-de-conversao skill with references"
```

---

### Task 12: Escrever skill `conhecimento-rag`

**Files:**
- Create: `packages/agents/src/skills/conhecimento-rag/SKILL.md`

**Fontes a compilar:**
- `tools/rag/search-previous-content-tool.ts` → getSearchPreviousContentInstructions()
- `tools/rag/graph-search-tool.ts` → getGraphSearchInstructions()
- writer-agent.ts → INTERNAL LINKING section

**Step 1: Escrever SKILL.md**
**Step 2: Commit**

```bash
git add packages/agents/src/skills/conhecimento-rag/
git commit -m "feat(agents): add conhecimento-rag skill"
```

---

### Task 13: Escrever skill `gestao-de-citacoes`

**Files:**
- Create: `packages/agents/src/skills/gestao-de-citacoes/SKILL.md`

**Fontes a compilar:**
- Princeton GEO research (citações +40%, estatísticas +37%, quotes +30%)
- davila7/content-research-writer → citation management formats
- `tools/analysis/citation-tool.ts` → getCitationInstructions()

**Step 1: Escrever SKILL.md**
**Step 2: Commit**

```bash
git add packages/agents/src/skills/gestao-de-citacoes/
git commit -m "feat(agents): add gestao-de-citacoes skill"
```

---

## Fase 2: Refatorar internals

### Task 14: Criar `utils.ts` (substituir shared.ts + helpers.ts)

**Files:**
- Create: `packages/agents/src/utils.ts`
- Modify: Nenhuma modificação nesta task — shared.ts e helpers.ts serão removidos na Fase 5

**Step 1: Criar utils.ts**

Conteúdo migrado de:
- `src/mastra/agents/shared.ts` → LANGUAGE_INSTRUCTION (tornar dinâmico), embeddingModel, pgVectorStore (sem conditional)
- `src/mastra/helpers.ts` → compileInstructionMemories, MastraLLMUsage type

```typescript
// src/utils.ts
import { ModelRouterEmbeddingModel } from "@mastra/core/llm";
import { PgVector } from "@mastra/pg";
import { env as serverEnv } from "@packages/environment/server";
import type { InstructionMemoryItem } from "@packages/database/schemas/instruction-memory";

// PgVector SEMPRE configurado — infraestrutura obrigatória
export const pgVectorStore = new PgVector({
   id: "mastra-rag",
   connectionString: serverEnv.PG_VECTOR_URL,
});

export const embeddingModel = new ModelRouterEmbeddingModel({
   providerId: "openrouter",
   modelId: "openai/text-embedding-3-small",
   url: "https://openrouter.ai/api/v1",
   apiKey: serverEnv.OPENROUTER_API_KEY,
});

export function buildLanguageInstruction(language: string): string {
   const languageMap: Record<string, string> = {
      "pt-BR": "Sempre responda e escreva conteúdo em Português Brasileiro (pt-BR).",
      "en-US": "Always respond and write content in American English (en-US).",
      "es": "Siempre responda y escriba contenido en Español.",
   };
   return `## IDIOMA DE SAÍDA\n${languageMap[language] ?? languageMap["pt-BR"]}`;
}

export type MastraLLMUsage = {
   inputTokens: number;
   outputTokens: number;
   totalTokens: number;
   reasoningTokens?: number | null;
   cachedInputTokens?: number | null;
};

export function compileInstructionMemories(
   writerInstructions: InstructionMemoryItem[],
): string {
   const enabledInstructions = writerInstructions
      .filter((i) => i.enabled)
      .sort((a, b) => a.order - b.order);

   if (enabledInstructions.length === 0) return "";

   const content = enabledInstructions
      .map((i) => `### ${i.title}\n${i.content}`)
      .join("\n\n");

   return `\n# INSTRUCTION MEMORIES\n\n## WRITER INSTRUCTIONS\n${content}\n`;
}
```

**Step 2: Commit**

```bash
git add packages/agents/src/utils.ts
git commit -m "feat(agents): add utils.ts (replaces shared.ts + helpers.ts)"
```

---

### Task 15: Refatorar RAG para funções puras + Zod schemas

**Files:**
- Modify: `packages/agents/src/mastra/rag/rag-service.ts`
- Create: `packages/agents/src/mastra/rag/schemas.ts` (Zod schemas, substituir types.ts)
- Delete (na Fase 5): `packages/agents/src/mastra/rag/types.ts`

**Step 1: Ler rag-service.ts e types.ts atuais para entender a interface**
**Step 2: Criar schemas.ts com Zod schemas (sem types.ts)**
**Step 3: Refatorar rag-service.ts para usar pgVectorStore de utils.ts (sem conditional)**
**Step 4: Verificar typecheck**

```bash
bun run typecheck --filter=@packages/agents
```

**Step 5: Commit**

```bash
git add packages/agents/src/mastra/rag/
git commit -m "refactor(agents): RAG as pure functions with Zod schemas"
```

---

### Task 16: Remover get*Instructions() de todas as ferramentas

**Files:**
- Modify: TODAS as ferramentas em `tools/editor/*.ts` (17 arquivos)
- Modify: TODAS as ferramentas em `tools/frontmatter/*.ts` (4 arquivos)
- Modify: TODAS as ferramentas em `tools/analysis/*.ts` (13 arquivos)
- Modify: TODAS as ferramentas em `tools/rag/*.ts` (2 arquivos)

**Regra:** Remover APENAS a função get*Instructions() e sua exportação. Manter a definição da tool (createTool) e sua exportação intactas.

**Step 1: Para cada arquivo de tool, remover a função get*Instructions() e seu export**

Exemplo (tools/editor/insert-text-tool.ts):
```diff
 export const insertTextTool = createTool({ ... });
-
-export function getInsertTextInstructions(): string {
-   return `...`;
-}
```

**Step 2: Atualizar writer-agent.ts para não importar get*Instructions()**

Remover TODAS as importações de get*Instructions e as funções aggregadoras (getAllEditorToolInstructions, getAllFrontmatterToolInstructions, getAllAnalysisToolInstructions, getAllRagToolInstructions). As instruções do writer-agent ficam mínimas — apenas persona base. O conhecimento vem das skills.

**Step 3: Verificar typecheck**

```bash
bun run typecheck --filter=@packages/agents
```

**Step 4: Commit**

```bash
git add packages/agents/src/mastra/tools/ packages/agents/src/mastra/agents/writer-agent.ts
git commit -m "refactor(agents): remove get*Instructions() from all tools — content migrated to skills"
```

---

## Fase 3: Criar sub-agentes + orchestrator

### Task 17: Refatorar writer-agent.ts

**Files:**
- Modify: `packages/agents/src/mastra/agents/writer-agent.ts`

**Step 1: Reescrever writer-agent.ts**

Mudanças:
- Importar de `../../utils` ao invés de `./shared` e `../helpers`
- Instruções mínimas (apenas persona base + regras críticas — ~50 linhas ao invés de ~200)
- Registrar tools com shorthand: `{ insertTextTool, replaceTextTool, ... }` ao invés de `{ insertText: insertTextTool, ... }`
- Usar `buildLanguageInstruction(requestContext?.get("language"))` ao invés de `LANGUAGE_INSTRUCTION` hardcoded
- Skills fornecem o conhecimento profundo — o agente confia nelas

**Step 2: Verificar typecheck**
**Step 3: Commit**

```bash
git add packages/agents/src/mastra/agents/writer-agent.ts
git commit -m "refactor(agents): slim down writer-agent — instructions migrated to skills"
```

---

### Task 18: Criar planner-agent.ts

**Files:**
- Create: `packages/agents/src/mastra/agents/planner-agent.ts`

**Step 1: Escrever planner-agent.ts**

- id: "planner-agent"
- model: "openrouter/x-ai/grok-4.1-fast"
- description em pt-BR para o orchestrator entender quando delegar
- Instruções mínimas (persona base)
- Tools: editTitleTool, editDescriptionTool, editKeywordsTool, searchPreviousContentTool

**Step 2: Commit**

```bash
git add packages/agents/src/mastra/agents/planner-agent.ts
git commit -m "feat(agents): add planner sub-agent"
```

---

### Task 19: Criar researcher-agent.ts

**Files:**
- Create: `packages/agents/src/mastra/agents/researcher-agent.ts`

**Step 1: Escrever researcher-agent.ts**

- id: "researcher-agent"
- Tools: searchPreviousContentTool, graphSearchTool + ferramentas de pesquisa de `tools/research/` (webSearchTool, serpAnalysisTool, contentGapTool, competitorContentTool, relatedKeywordsTool, factFinderTool, webCrawlTool, researchCompletenessTool)

**Step 2: Commit**

```bash
git add packages/agents/src/mastra/agents/researcher-agent.ts
git commit -m "feat(agents): add researcher sub-agent"
```

---

### Task 20: Criar seo-auditor-agent.ts

**Files:**
- Create: `packages/agents/src/mastra/agents/seo-auditor-agent.ts`

**Step 1: Escrever seo-auditor-agent.ts**

- id: "seo-auditor-agent"
- Tools: TODAS as ferramentas de análise (seoScoreTool, readabilityTool, keywordDensityTool, contentStructureTool, badPatternTool, titleMetaTool, quickAnswerAnalysisTool, imageSeoTool, linkDensityTool, duplicateContentTool, toneAnalysisTool, citationTool, originalityTool)

**Step 2: Commit**

```bash
git add packages/agents/src/mastra/agents/seo-auditor-agent.ts
git commit -m "feat(agents): add seo-auditor sub-agent"
```

---

### Task 21: Criar reviewer-agent.ts

**Files:**
- Create: `packages/agents/src/mastra/agents/reviewer-agent.ts`

**Step 1: Escrever reviewer-agent.ts**

- id: "reviewer-agent"
- Tools: toneAnalysisTool, citationTool, originalityTool, readabilityTool, badPatternTool, contentStructureTool

**Step 2: Commit**

```bash
git add packages/agents/src/mastra/agents/reviewer-agent.ts
git commit -m "feat(agents): add reviewer sub-agent"
```

---

### Task 22: Criar orchestrator-agent.ts

**Files:**
- Create: `packages/agents/src/mastra/agents/orchestrator-agent.ts`

**Step 1: Escrever orchestrator-agent.ts**

- id: "orchestrator-agent"
- Sem tools próprios — apenas sub-agentes
- `agents: { writer: writerAgent, planner: plannerAgent, researcher: researcherAgent, seoAuditor: seoAuditorAgent, reviewer: reviewerAgent }`
- Instruções explicam quando delegar para cada especialista
- Model dinâmico via requestContext

**Step 2: Commit**

```bash
git add packages/agents/src/mastra/agents/orchestrator-agent.ts
git commit -m "feat(agents): add orchestrator agent with sub-agent delegation"
```

---

### Task 23: Criar workspace.ts e atualizar mastra.ts

**Files:**
- Create: `packages/agents/src/workspace.ts`
- Modify: `packages/agents/src/mastra/index.ts`

**Step 1: Criar workspace.ts**

```typescript
import { Workspace, LocalFilesystem } from "@mastra/core/workspace";
import path from "node:path";

const basePath = path.resolve(import.meta.dirname, "..");

export const workspace = new Workspace({
   filesystem: new LocalFilesystem({ basePath }),
   skills: ["/src/skills"],
   bm25: true,
});
```

**Step 2: Atualizar mastra/index.ts**

Mudanças:
- Importar orchestratorAgent ao invés de writerAgent como agente principal
- Manter writerAgent como import mas não registrar diretamente (é sub-agente do orchestrator)
- Importar pgVectorStore de `../utils` ao invés de `./agents/shared`
- Remover conditional `vectorsConfig` — sempre configurado
- Adicionar workspace
- Remover bundler.transpilePackages (avaliar se ainda necessário)
- Atualizar createRequestContext para incluir `language`
- Atualizar CustomRequestContext type

**Step 3: Verificar typecheck**

```bash
bun run typecheck --filter=@packages/agents
```

**Step 4: Commit**

```bash
git add packages/agents/src/workspace.ts packages/agents/src/mastra/index.ts
git commit -m "feat(agents): add workspace with skill discovery and update mastra instance"
```

---

## Fase 4: Atualizar consumidores

### Task 24: Atualizar apps/web para usar orchestrator

**Files:**
- Modify: Arquivo(s) em apps/ que importam e usam `mastra.getAgent("writerAgent")`

**Step 1: Buscar todos os usos de writerAgent nos apps**

```bash
rg "writerAgent|writer-agent|getAgent.*writer" apps/ packages/api/
```

**Step 2: Atualizar para usar orchestratorAgent para chat, manter writerAgent para FIM/inline**
**Step 3: Verificar typecheck e build**

```bash
bun run typecheck && bun run build
```

**Step 4: Commit**

```bash
git commit -m "refactor(web): use orchestrator agent for chat, keep writer for direct calls"
```

---

### Task 25: Atualizar package.json exports

**Files:**
- Modify: `packages/agents/package.json`

**Step 1: Atualizar exports**

De:
```json
{
   ".": { "default": "./src/mastra/index.ts" },
   "./models": { "default": "./src/models.ts" },
   "./rag/rag-service": { "default": "./src/mastra/rag/rag-service.ts" },
   "./rag/content-indexer": { "default": "./src/mastra/rag/content-indexer.ts" }
}
```

Para:
```json
{
   "./mastra": { "default": "./src/mastra/index.ts", "types": "..." },
   "./models": { "default": "./src/models.ts", "types": "..." },
   "./rag/*": { "default": "./src/mastra/rag/*.ts", "types": "..." }
}
```

**Nota:** Remover o export `.` (barrel) — usar `./mastra` explicitamente.

**Step 2: Atualizar todos os imports nos apps que usam `@packages/agents`**

```bash
rg '@packages/agents"' apps/ packages/
```

Trocar `@packages/agents` por `@packages/agents/mastra`.

**Step 3: Verificar typecheck**
**Step 4: Commit**

```bash
git commit -m "refactor(agents): update package exports, remove barrel entry point"
```

---

## Fase 5: Limpeza

### Task 26: Remover arquivos obsoletos

**Files:**
- Delete: `packages/agents/src/mastra/agents/shared.ts`
- Delete: `packages/agents/src/mastra/helpers.ts`
- Delete: `packages/agents/src/mastra/rag/types.ts`
- Delete: `packages/agents/src/mastra/tools/get-writing-guidelines-tool.ts` (se instruções migraram para skills)
- Delete: `packages/agents/src/mastra/tools/get-rag-guidelines-tool.ts` (se instruções migraram para skills)
- Delete: `packages/agents/src/mastra/tools/get-audience-profile-guidelines-tool.ts` (se instruções migraram para skills)

**Step 1: Verificar que nenhum arquivo importa os deletados**

```bash
rg "from.*shared|from.*helpers|from.*types|get-writing-guidelines|get-rag-guidelines|get-audience-profile" packages/agents/src/
```

**Step 2: Deletar arquivos**
**Step 3: Verificar typecheck e build**

```bash
bun run typecheck --filter=@packages/agents && bun run build --filter=@packages/agents
```

**Step 4: Commit**

```bash
git commit -m "chore(agents): remove obsolete files (shared.ts, helpers.ts, types.ts, guideline tools)"
```

---

### Task 27: Verificação final

**Step 1: Typecheck completo**

```bash
bun run typecheck
```

**Step 2: Build completo**

```bash
bun run build
```

**Step 3: Verificar que skills são descobertas pelo Workspace**

Criar um script temporário de teste ou testar via `bun run dev:server`.

**Step 4: Verificar que o orchestrator delega corretamente**

Testar manualmente via chat:
- "Escreva um blog post sobre TypeScript generics" → deve delegar para writer
- "Analise o SEO deste conteúdo" → deve delegar para seo-auditor
- "Faça uma pesquisa sobre React Server Components" → deve delegar para researcher
- "Revise este conteúdo" → deve delegar para reviewer

**Step 5: Commit final se houver ajustes**

```bash
git commit -m "chore(agents): final cleanup after restructure verification"
```

---

## Resumo de Tasks

| Fase | Tasks | Descrição |
|------|-------|-----------|
| **Fase 1** | Tasks 1-13 | Criar 12 skills com SKILL.md + references (sem mudar agentes) |
| **Fase 2** | Tasks 14-16 | Refatorar internals (utils.ts, RAG, remover get*Instructions) |
| **Fase 3** | Tasks 17-23 | Criar sub-agentes + orchestrator + workspace |
| **Fase 4** | Tasks 24-25 | Atualizar consumidores (apps, exports) |
| **Fase 5** | Tasks 26-27 | Limpeza + verificação final |

**Total: 27 tasks**
