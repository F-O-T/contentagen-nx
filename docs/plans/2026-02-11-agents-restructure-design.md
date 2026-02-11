# Reestruturação do Pacote de Agentes — Design

> **Para Claude:** SUB-SKILL NECESSÁRIA: Use superpowers:executing-plans para implementar este plano tarefa por tarefa.

**Objetivo:** Reestruturar `packages/agents` de um monolito com 40+ ferramentas hardcoded em um único agente para uma arquitetura de Orchestrator + Sub-agentes especializados + Skills Mastra, com suporte multi-idioma e composabilidade.

**Arquitetura:** Orchestrator delega para sub-agentes especializados (Writer, Planner, Researcher, SEO Auditor, Reviewer). Skills Mastra fornecem conhecimento de domínio como SKILL.md + references/. RAG é funcional (sem classes), PgVector sempre configurado. Ferramentas desacopladas das instruções.

**Tech Stack:** Mastra Core 1.2.0 (Workspace + Skills), PgVector, Zod schemas (sem types.ts), TypeScript

---

## 1. Visão Geral da Arquitetura

### De: Monolito com ferramentas hardcoded

```
agents/
  mastra/
    agents/writer-agent.ts  ← 40+ ferramentas, prompt gigante de 500 linhas
    tools/editor/*.ts       ← ferramentas exportam get*Instructions()
    tools/analysis/*.ts
    rag/
```

### Para: Orchestrator + Sub-agentes + Skills

```
packages/agents/src/
├── models.ts                        # Lista de modelos (frontend-safe, não muda)
├── mastra.ts                        # Instância Mastra (limpa, pequena)
├── workspace.ts                     # Workspace config com skill discovery
├── utils.ts                         # embeddingModel, pgVectorStore, helpers
│
├── agents/
│   ├── orchestrator-agent.ts        # Agente principal — delega para sub-agentes
│   ├── writer-agent.ts              # Sub-agente: escrita + edição de conteúdo
│   ├── planner-agent.ts             # Sub-agente: planejamento, outlines, briefings
│   ├── researcher-agent.ts          # Sub-agente: pesquisa SERP, análise de concorrência
│   ├── seo-auditor-agent.ts         # Sub-agente: análise SEO + otimização
│   ├── reviewer-agent.ts            # Sub-agente: revisão de qualidade, tom, fact-check
│   ├── fim-agent.ts                 # Standalone: fill-in-middle (sem delegação)
│   └── inline-edit-agent.ts         # Standalone: edição inline (sem delegação)
│
├── skills/                          # Skills Mastra (conhecimento de domínio)
│   ├── edicao-de-conteudo/
│   │   └── SKILL.md
│   ├── gestao-de-frontmatter/
│   │   └── SKILL.md
│   ├── diretrizes-de-escrita/
│   │   ├── SKILL.md
│   │   └── references/
│   │       ├── frameworks-de-conteudo.md
│   │       ├── templates-por-tipo.md
│   │       ├── tecnicas-de-engajamento.md
│   │       └── formulas-de-titulo.md
│   ├── otimizacao-seo/
│   │   ├── SKILL.md
│   │   └── references/
│   │       ├── rubrica-de-pontuacao.md
│   │       ├── sinais-eeat.md
│   │       └── checklist-seo-completo.md
│   ├── otimizacao-geo/
│   │   ├── SKILL.md
│   │   └── references/
│   │       ├── 9-metodos-princeton.md
│   │       ├── algoritmos-por-plataforma.md
│   │       ├── padroes-aeo-conteudo.md
│   │       └── templates-schema-jsonld.md
│   ├── estrategia-de-conteudo/
│   │   ├── SKILL.md
│   │   └── references/
│   │       ├── keywords-por-etapa-do-funil.md
│   │       ├── framework-pillar-cluster.md
│   │       └── matriz-de-priorizacao.md
│   ├── pesquisa-de-conteudo/
│   │   ├── SKILL.md
│   │   └── references/
│   │       └── fontes-de-pesquisa.md
│   ├── revisao-de-conteudo/
│   │   ├── SKILL.md
│   │   └── references/
│   │       └── checklist-de-revisao.md
│   ├── escrita-humana/
│   │   ├── SKILL.md
│   │   └── references/
│   │       └── padroes-de-deteccao-ia.md
│   ├── copywriting-de-conversao/
│   │   ├── SKILL.md
│   │   └── references/
│   │       ├── principios-de-persuasao.md
│   │       ├── frameworks-de-cta.md
│   │       └── analise-de-headlines.md
│   ├── conhecimento-rag/
│   │   └── SKILL.md
│   └── gestao-de-citacoes/
│       └── SKILL.md
│
├── tools/                           # Definições de ferramentas puras (sem instruções)
│   ├── editor/                      # insertText, replaceText, etc.
│   ├── frontmatter/                 # editTitle, editSlug, etc.
│   ├── analysis/                    # seoScore, readability, etc.
│   ├── rag/                         # searchPreviousContent, graphSearch
│   └── memory/                      # getInstructionMemories
│
└── rag/                             # Serviço RAG (funções puras)
    ├── rag-service.ts
    ├── content-indexer.ts
    └── schemas.ts                   # Zod schemas (sem types.ts)
```

---

## 2. Agentes

### 2.1 Orchestrator Agent

O único agente exposto ao servidor/frontend para chat. Delega para sub-agentes especializados via propriedade `agents` do Mastra.

```typescript
export const orchestratorAgent = new Agent({
  id: "orchestrator-agent",
  name: "Content Orchestrator",
  model: ({ requestContext }) => {
    return requestContext?.get("model") ?? "openrouter/x-ai/grok-4.1-fast";
  },
  instructions: ({ requestContext }) => {
    const language = requestContext?.get("language") ?? "pt-BR";
    return `...instruções do orchestrator em ${language}...`;
  },
  agents: {
    writer: writerAgent,
    planner: plannerAgent,
    researcher: researcherAgent,
    seoAuditor: seoAuditorAgent,
    reviewer: reviewerAgent,
  },
});
```

**Regras do Orchestrator:**
- Analisa intenção do usuário e delega para o especialista correto
- Pode delegar para múltiplos especialistas sequencialmente
- Sintetiza resultados quando combina trabalho de múltiplos especialistas
- Para perguntas simples, responde diretamente sem delegação

### 2.2 Writer Agent (Sub-agente)

Especialista em escrita e edição de blog posts. Ferramentas de editor, frontmatter, RAG e memória.

```typescript
export const writerAgent = new Agent({
  id: "writer-agent",
  name: "Writer Agent",
  description: "Escritor e editor expert de blog posts. Escreve, edita e otimiza conteúdo usando ferramentas markdown em um editor rich text.",
  model: "openrouter/x-ai/grok-4.1-fast",
  instructions: ({ requestContext }) => { ... },
  tools: {
    insertTextTool,
    replaceTextTool,
    deleteTextTool,
    formatTextTool,
    insertHeadingTool,
    insertListTool,
    insertCodeBlockTool,
    insertTableTool,
    insertImageTool,
    injectKeywordsTool,
    addInternalLinksTool,
    improveReadabilityTool,
    optimizeTitleTool,
    optimizeMetaTool,
    generateQuickAnswerTool,
    suggestImagesTool,
    addExternalLinksTool,
    editTitleTool,
    editDescriptionTool,
    editSlugTool,
    editKeywordsTool,
    seoScoreTool,
    readabilityTool,
    keywordDensityTool,
    searchPreviousContentTool,
    graphSearchTool,
    getInstructionsTool,
  },
});
```

### 2.3 Planner Agent (Sub-agente)

Especialista em planejamento de conteúdo — outlines, briefings, calendários editoriais, clusters de conteúdo.

```typescript
export const plannerAgent = new Agent({
  id: "planner-agent",
  name: "Content Planner",
  description: "Estrategista de conteúdo expert. Planeja estrutura, cria outlines, briefings editoriais e clusters de tópicos.",
  model: "openrouter/x-ai/grok-4.1-fast",
  tools: {
    editTitleTool,
    editDescriptionTool,
    editKeywordsTool,
    searchPreviousContentTool,
  },
});
```

### 2.4 Researcher Agent (Sub-agente)

Especialista em pesquisa — análise SERP, pesquisa de concorrência, gap de conteúdo.

```typescript
export const researcherAgent = new Agent({
  id: "researcher-agent",
  name: "Content Researcher",
  description: "Pesquisador de conteúdo expert. Analisa SERPs, pesquisa concorrência, identifica gaps de conteúdo e coleta dados.",
  model: "openrouter/x-ai/grok-4.1-fast",
  tools: {
    searchPreviousContentTool,
    graphSearchTool,
    // + ferramentas de pesquisa web (webSearch, serpAnalysis, etc.) quando implementadas
  },
});
```

### 2.5 SEO Auditor Agent (Sub-agente)

Especialista em análise SEO — scoring, auditoria, recomendações de otimização.

```typescript
export const seoAuditorAgent = new Agent({
  id: "seo-auditor-agent",
  name: "SEO Auditor",
  description: "Auditor SEO expert. Analisa qualidade SEO, legibilidade, densidade de keywords e gera recomendações de otimização.",
  model: "openrouter/x-ai/grok-4.1-fast",
  tools: {
    seoScoreTool,
    readabilityTool,
    keywordDensityTool,
    contentStructureTool,
    badPatternTool,
    titleMetaTool,
    quickAnswerAnalysisTool,
    imageSeoTool,
    linkDensityTool,
    duplicateContentTool,
    toneAnalysisTool,
    citationTool,
    originalityTool,
  },
});
```

### 2.6 Reviewer Agent (Sub-agente)

Especialista em revisão de qualidade — tom, consistência, fact-checking, originalidade.

```typescript
export const reviewerAgent = new Agent({
  id: "reviewer-agent",
  name: "Content Reviewer",
  description: "Revisor de conteúdo expert. Revisa qualidade, consistência de tom, originalidade e citações.",
  model: "openrouter/x-ai/grok-4.1-fast",
  tools: {
    toneAnalysisTool,
    citationTool,
    originalityTool,
    readabilityTool,
    badPatternTool,
    contentStructureTool,
  },
});
```

### 2.7 FIM Agent e Inline Edit Agent (Standalone)

Permanecem iguais — chamados diretamente pelo servidor, não passam pelo orchestrator.

---

## 3. Skills — Catálogo Completo (12 Skills)

Todas as skills em pt-BR. Cada skill é focada exclusivamente em **blog posts** — nenhum conteúdo genérico sobre landing pages, e-commerce, email marketing, etc.

### Mapa de Afinidade: Skill → Agente

| Skill | Writer | Planner | Researcher | SEO Auditor | Reviewer |
|-------|:------:|:-------:|:----------:|:-----------:|:--------:|
| edicao-de-conteudo | ● | | | | |
| gestao-de-frontmatter | ● | ● | | | |
| diretrizes-de-escrita | ● | | | | ● |
| otimizacao-seo | ● | | | ● | |
| otimizacao-geo | ● | | | ● | |
| estrategia-de-conteudo | | ● | ● | | |
| pesquisa-de-conteudo | | ● | ● | | |
| revisao-de-conteudo | | | | | ● |
| escrita-humana | ● | | | | ● |
| copywriting-de-conversao | ● | ● | | | |
| conhecimento-rag | ● | | ● | | |
| gestao-de-citacoes | ● | | ● | | ● |

### 3.1 `edicao-de-conteudo/SKILL.md`

**Fontes compiladas:**
- Instruções existentes de get*Instructions() de TODAS as ferramentas de editor
- writer-agent.ts (markdown rules, image rules, table guidelines)

**Conteúdo:** Padrões de uso de cada ferramenta de editor para manipulação de blog posts em um editor Lexical rich text.

Inclui:
- insertTextTool: quando usar, parâmetros, exemplos
- replaceTextTool: quando usar, parâmetros, exemplos
- deleteTextTool: quando usar, parâmetros, exemplos
- formatTextTool: bold, italic, code inline
- insertHeadingTool: regras de hierarquia (nunca H1, H2 para seções, H3 para sub)
- insertListTool: bullet e numbered
- insertCodeBlockTool: blocos de código com linguagem
- insertTableTool: max 3-5 colunas, quando usar vs não usar
- insertImageTool: NUNCA escrever ![alt](url) manualmente, sempre usar tool
- injectKeywordsTool: injeção natural de keywords para 1-2% densidade
- addInternalLinksTool: links contextuais para conteúdo publicado
- addExternalLinksTool: links para fontes autoritativas
- improveReadabilityTool: reescrever para Flesch 60+
- optimizeTitleTool: melhorar título para SEO + cliques
- optimizeMetaTool: melhorar meta description
- generateQuickAnswerTool: formato featured snippet
- suggestImagesTool: sugerir posicionamento de imagens

Regras:
- Nunca usar H1 no corpo — título está no frontmatter
- H2 a cada 200-300 palavras
- Máximo 3-4 frases por parágrafo
- Tabelas: max 3-5 colunas (mobile-friendly)
- Para imagens: sempre usar insertImageTool
- Após cada tool call: refletir no resultado, pensar no próximo passo, agir

### 3.2 `gestao-de-frontmatter/SKILL.md`

**Fontes compiladas:**
- Instruções existentes de get*Instructions() de todas as ferramentas de frontmatter
- writer-agent.ts (FIRST STEPS, KEYWORD USAGE)

**Conteúdo:** Estratégia de metadados de blog posts — títulos, meta descriptions, slugs e keywords.

Inclui:
- Regra crítica: SEMPRE frontmatter ANTES de escrever conteúdo
- editTitleTool: 50-60 caracteres, keyword primária no início, power words
- editDescriptionTool: 150-160 caracteres, keyword incluída, proposta de valor
- editSlugTool: curto, descritivo, lowercase, hifenizado
- editKeywordsTool: até 10 keywords, primeira = primária
- Estratégia de keywords: primária no título + primeiros 100 palavras + pelo menos um H2 + 1-2% densidade
- Keywords secundárias: naturalmente em headings e corpo
- Exemplos em pt-BR com ❌/✅ para cada campo

### 3.3 `diretrizes-de-escrita/SKILL.md` + references/

**Fontes compiladas:**
- writer-agent.ts (WRITING PRINCIPLES, ANSWER FIRST, CONTENT STRUCTURES, ENGAGEMENT TECHNIQUES, CONCLUSIONS, QUALITY CHECKLIST)
- coreyhaines/copywriting (writing style rules, best practices, CTA copy)
- anthropics/content-creation (blog post structure, writing best practices)
- 1nfsh/technical-blog-writing (5 tipos de post com estruturas distintas, word counts, developer anti-patterns, audience depth)
- langchain-ai/blog-post (blog post structure: Hook, Context, Main Content, Application, Conclusion)
- eddiebe147/blog-post-writer (full creation workflow, enhancement workflow)
- sickn33/seo-content-writer (E-E-A-T signals, content creation framework, quality standards)
- davila7/content-research-writer (collaborative outlining, section feedback, voice preservation)

**SKILL.md** (~200 linhas, conciso):
- Princípios fundamentais (conversacional mas autoritativo, voz ativa, segunda pessoa, específico, rítmico)
- Regra de Ouro: Responder PRIMEIRO nos primeiros 100 palavras
- Formatos de resposta rápida (TL;DR Box, Definition Lead, Comparison Table)
- NUNCA fazer (preamble longo, "Neste artigo vamos explorar...", "No mundo acelerado de hoje...")
- Checklist de qualidade pós-escrita
- Links para references/

**references/frameworks-de-conteudo.md** (~300 linhas):
- Framework PASTOR (conteúdo How-To)
- Pirâmide Invertida (informacional)
- Power List (listicles)
- Hub & Spoke (clusters de tópicos)

**references/templates-por-tipo.md** (~400 linhas):
Compilado de 1nfsh/technical-blog-writing + langchain-ai/blog-post + anthropics/content-creation + sickn33/seo-content-writer:
- Tutorial / How-To (1.500-3.000 palavras): mostrar resultado final primeiro, pré-requisitos explícitos, passo a passo, código completo
- Deep Dive / Explicador (2.000-4.000 palavras): conceito, modelo mental simplificado, mecânica detalhada, exemplo real, trade-offs
- Comparação / Benchmark (1.500-2.500 palavras): o que comparamos, metodologia, resultados com tabelas, análise, recomendação
- Estudo de Caso (1.500-2.500 palavras): desafio, solução, resultados quantificados, lições
- Listicle (1.000-2.000 palavras): subtítulos com benefício, cada item: O quê → Por quê → Como
- Quick Tip (500-800 palavras): um conceito, um exemplo, TL;DR primeiro
- Regras específicas por tipo (código executável, versões pinadas, error handling)

**references/tecnicas-de-engajamento.md** (~200 linhas):
- Bucket brigades: "Mas aqui está o ponto:" | "E a melhor parte?" | "A verdade é:"
- Pattern interrupts: frases curtas, perguntas diretas, callouts em negrito
- Show don't tell: "Esta técnica é eficaz" → "Esta técnica aumentou conversões em 47%"
- Profundidade por audiência: iniciante (explicar tudo), avançado (pular basics), comparação (foco em diferenças)

**references/formulas-de-titulo.md** (~250 linhas):
Compilado de coreyhaines/copywriting (headline formulas) + anthropics/content-creation (headline formulas + hook formulas) + dkyazzentwatwa/blog-post-optimizer (power words, emotional impact):
- Fórmulas baseadas em resultado: "{Alcance resultado} sem {dor}"
- Fórmulas baseadas em problema: "Nunca {evento ruim} de novo"
- Fórmulas baseadas em prova: "[Número] [pessoas] usam [produto] para [resultado]"
- Fórmulas de hook: estatística surpreendente, afirmação contrária, cenário, bold claim
- Power words por categoria: urgência, curiosidade, especificidade, emoção, valor
- Scoring de headlines: 50-60 chars, keyword, power word, especificidade

### 3.4 `otimizacao-seo/SKILL.md` + references/

**Fontes compiladas:**
- Instruções existentes de get*Instructions() de TODAS as ferramentas de análise
- coreyhaines/seo-audit (audit framework completo, priority order, E-E-A-T, content quality assessment)
- addyosmani/seo (on-page SEO, heading structure, image SEO, internal linking, structured data)
- sickn33/seo-content-writer (keyword density 0.5-1.5%, grade 8-10 reading level, E-E-A-T elements)
- dkyazzentwatwa/blog-post-optimizer (SEO scoring model, headline analysis, readability targets)

**SKILL.md** (~200 linhas):
- Ordem de prioridade da auditoria: título > meta > headings > keywords > comprimento > quick answer > links > imagens
- Checklist on-page SEO para blog posts
- Regras de título: 50-60 chars, keyword no início
- Regras de meta: 150-160 chars, keyword + proposta de valor
- Estratégia de keywords: primária 1-2% densidade, nunca stuffing
- Estrutura de headings: sem H1 no corpo, H2 a cada 200-300 palavras
- Validação pós-escrita: seoScoreTool, readabilityTool, keywordDensityTool

**references/rubrica-de-pontuacao.md** (~150 linhas):
Compilado do seoScoreTool existente:
- Título (15pts), Meta (10pts), Headings (15pts), Comprimento (10pts), Keywords (15pts), Links (10pts), Quick Answer (10pts), Estrutura (5pts), Conclusão (5pts), Imagens (5pts)
- Breakdowns detalhados por categoria

**references/sinais-eeat.md** (~200 linhas):
Compilado de coreyhaines/seo-audit (E-E-A-T section) + sickn33/seo-content-writer (E-E-A-T elements):
- Experiência: experiência em primeira mão, insights originais, estudos de caso reais
- Especialização: credenciais do autor, informação precisa, fontes citadas
- Autoridade: reconhecido no espaço, citado por outros
- Confiabilidade: informação precisa, transparente, site seguro

**references/checklist-seo-completo.md** (~300 linhas):
Compilado de resciencelab/seo-geo (SEO checklist) + addyosmani/seo (audit checklist) — filtrado apenas para blog posts:
- P0 Crítico: título único, meta description, H1 único, HTTPS, sem noindex
- P1 Importante: canonical tags, heading hierarchy, keyword no primeiro parágrafo, internal links
- P2 Recomendado: OG tags, alt text em imagens, URLs descritivos

### 3.5 `otimizacao-geo/SKILL.md` + references/

**Fontes compiladas:**
- resciencelab/seo-geo (SKILL.md completo + geo-research.md + platform-algorithms.md + schema-templates.md + seo-checklist.md)
- Suas references existentes: aeo-geo-patterns.md

**SKILL.md** (~200 linhas):
- Insight chave: AI search engines citam fontes, não rankeiam páginas. Ser citado = ranking #1
- 9 Métodos GEO de Princeton (tabela com % de boost)
- Melhor combinação: Fluência + Estatísticas = boost máximo
- Estrutura de conteúdo para citação por IA: answer-first, parágrafos auto-contidos, tabelas, FAQ
- Padrões de blocos quotáveis: Definition Block, Statistic Citation Block, Self-Contained Answer Block

**references/9-metodos-princeton.md** (~400 linhas):
Compilação COMPLETA da pesquisa Princeton — cada método com:
- O que é, por que funciona, como aplicar, exemplos before/after em pt-BR
- Cite Sources (+40%), Statistics (+37%), Quotation (+30%), Authoritative Tone (+25%), Easy-to-Understand (+20%), Technical Terms (+18%), Unique Words (+15%), Fluency (+15-30%), Keyword Stuffing (-10%)
- Melhores combinações por domínio
- Métricas GEO (Position-Adjusted Word Count, Subjective Impression Score)
- Checklist de implementação

**references/algoritmos-por-plataforma.md** (~500 linhas):
Compilação COMPLETA dos algoritmos — focado no que importa para blog posts:
- ChatGPT: autoridade de domínio, frescor 30 dias, Content-Answer Fit (55%), estrutura on-page (14%)
- Perplexity: FAQ Schema (+40% visibilidade), relevância semântica, velocidade de publicação
- Google AI Overview: E-E-A-T, structured data, Knowledge Graph, clusters de conteúdo
- Copilot/Bing: índice Bing, IndexNow, velocidade < 2s
- Claude: Brave Search indexing, densidade factual, clareza estrutural
- Tabela comparativa cross-platform

**references/padroes-aeo-conteudo.md** (~300 linhas):
Compilação de suas references existentes (aeo-geo-patterns.md) — adaptada para blog posts:
- Definition Block para "O que é X?"
- Step-by-Step Block para "Como fazer X"
- Comparison Table para "X vs Y"
- Pros and Cons Block para avaliações
- FAQ Block para páginas de tópico
- Statistic Citation Block, Expert Quote Block, Authoritative Claim Block
- Otimização para busca por voz

**references/templates-schema-jsonld.md** (~400 linhas):
Compilação de resciencelab/seo-geo (schema-templates.md) + addyosmani/seo (structured data) — apenas os relevantes para blog:
- Article Schema (blog posts)
- FAQPage Schema (+40% visibilidade IA)
- HowTo Schema (tutoriais)
- BreadcrumbList Schema
- SpeakableSpecification (busca por voz)
- Combined Schema example
- Links de validação

### 3.6 `estrategia-de-conteudo/SKILL.md` + references/

**Fontes compiladas:**
- coreyhaines/content-strategy (SKILL.md completo: searchable vs shareable, content pillars, buyer stage keywords, prioritization)
- eddiebe147/blog-post-writer (series planning, content audit workflow)
- langchain-ai/blog-post (research-first workflow)

**SKILL.md** (~200 linhas):
- Buscável vs Compartilhável: cada post deve ser um ou ambos
- Content Pillars: 3-5 tópicos core que a marca domina
- Planejamento de séries: tema → subtópicos → sequência → interlinking → cadência
- Auditoria de conteúdo existente: revisar, reorganizar, alinhar voz, melhorar SEO

**references/keywords-por-etapa-do-funil.md** (~200 linhas):
- Consciência: "o que é", "como", "guia de"
- Consideração: "melhor", "vs", "alternativas", "comparação"
- Decisão: "preço", "review", "demo", "teste"
- Implementação: "template", "tutorial", "como usar"
- Modificadores de keyword para cada etapa

**references/framework-pillar-cluster.md** (~200 linhas):
- Como identificar pillars: product-led, audience-led, search-led, competitor-led
- Estrutura de cluster: Pillar Topic → Subtopic Clusters → Articles
- Interligação estratégica entre posts
- Hub & Spoke para blog: post pilar + posts spoke
- Content types por etapa: use-case content, hub pages, thought leadership, data-driven

**references/matriz-de-priorizacao.md** (~150 linhas):
- Impacto no Cliente (40%): frequência do tópico, % de clientes afetados, carga emocional
- Content-Market Fit (30%): alinhamento com produto, insights únicos, histórias de clientes
- Potencial de Busca (20%): volume, competitividade, long-tail, tendência
- Recursos (10%): expertise, pesquisa necessária, assets
- Template de scoring

### 3.7 `pesquisa-de-conteudo/SKILL.md` + references/

**Fontes compiladas:**
- davila7/content-research-writer (research workflow, citation management)
- coreyhaines/content-strategy (competitor analysis, forum research, keyword data analysis)
- langchain-ai/blog-post (research-first requirement)

**SKILL.md** (~150 linhas):
- Workflow de pesquisa: análise SERP → identificar padrões top → analisar concorrência → coletar dados → compilar briefing
- Análise SERP: volume, dificuldade, intenção, featured snippet format, People Also Ask
- Análise de concorrência: profundidade, estrutura, ângulos únicos, gaps
- Output: briefing de pesquisa com keyword target, top 5 concorrentes, gaps, dados coletados

**references/fontes-de-pesquisa.md** (~150 linhas):
- Reddit: `site:reddit.com [tópico]` — posts top, perguntas, respostas votadas
- Quora: `site:quora.com [tópico]` — perguntas mais seguidas
- Fóruns de indústria: Indie Hackers, Hacker News, Product Hunt
- Como encontrar citações de experts e estatísticas
- Validação de fontes e verificação de recência

### 3.8 `revisao-de-conteudo/SKILL.md` + references/

**Fontes compiladas:**
- davila7/content-research-writer (section-by-section feedback format, full draft review format)
- dkyazzentwatwa/blog-post-optimizer (analysis dimensions: headline, SEO, structure, readability, stats)
- coreyhaines/seo-audit (audit output format: issue, impact, evidence, fix, priority)

**SKILL.md** (~150 linhas):
- Framework de revisão: estrutura → qualidade → tom → legibilidade → fact-checking
- Formato de feedback por seção: O que funciona ✓, Sugestões, Edições específicas
- Output: relatório de revisão com issues por prioridade (High/Medium/Low)

**references/checklist-de-revisao.md** (~200 linhas):
- Estrutura: hierarquia de headings, H2 a cada 200-300 palavras, introdução responde imediatamente, conclusão com takeaways + CTA
- Qualidade: claims com evidência, dados específicos, profundidade consistente
- Tom: voz da marca consistente, sem mudanças abruptas, conversacional mas autoritativo
- Legibilidade: parágrafos curtos, comprimento de frases variado, Flesch 60+
- Fact-check: estatísticas com fontes, claims verificáveis, informação atualizada
- Formato do relatório final: sumário executivo, findings por prioridade, plano de ação

### 3.9 `escrita-humana/SKILL.md` + references/

**Fontes compiladas:**
- Suas references existentes: ai-writing-detection.md (COMPLETO)
- 1nfsh/technical-blog-writing (developer anti-patterns: "Simply do X", "As we all know...")
- writer-agent.ts (BAD Patterns to Avoid)

**SKILL.md** (~150 linhas):
- Tell #1: Em dashes (—) — usar vírgulas, dois pontos ou parênteses
- Verbos a substituir: delve → explorar, leverage → usar, utilize → usar, etc.
- Adjetivos a substituir: robust → forte, comprehensive → completo, pivotal → chave, etc.
- Frases proibidas: "No mundo acelerado de hoje...", "Neste artigo vamos...", "Sem mais delongas..."
- Anti-padrões para blog de desenvolvedor: "Simplesmente faça X", "Como todos sabemos..."
- Palavras de preenchimento a remover: absolutamente, essencialmente, fundamentalmente, etc.
- Auto-verificação: ler em voz alta, verificar estruturas repetitivas, comprimentos variados

**references/padroes-de-deteccao-ia.md** (~200 linhas):
Compilação COMPLETA de ai-writing-detection.md — traduzido para pt-BR:
- Tabelas completas de substituição: verbos, adjetivos, transições, frases acadêmicas
- Seções de frases a evitar por posição: abertura, transição, conclusão
- Padrões estruturais a evitar: "Seja você X, Y ou Z...", "Não é apenas X, é também Y..."

### 3.10 `copywriting-de-conversao/SKILL.md` + references/

**Fontes compiladas:**
- Suas references existentes: conversion-psychology.md (COMPLETO)
- coreyhaines/copywriting (CTA copy guidelines, writing style rules, best practices)
- anthropics/content-creation (CTA best practices, CTA examples by context)
- dkyazzentwatwa/blog-post-optimizer (headline analysis, power words)

**Nota:** Filtrado APENAS para blog posts — sem landing pages, emails, social media.

**SKILL.md** (~150 linhas):
- Verdade fundamental: 95% das decisões de compra são subconscientes. Emoção primeiro, lógica depois.
- Gatilhos emocionais: alegria (mostrar transformação), medo/FOMO (urgência real), pertencimento, gratificação instantânea
- CTAs para blog posts: nunca "Leia mais" ou "Clique aqui" — ser específico
- Regra 80/20: 80% conteúdo de valor, 20% promocional
- Linha ética: genuíno vs manipulativo

**references/principios-de-persuasao.md** (~200 linhas):
Compilação de conversion-psychology.md — focado em blog posts:
- Gatilhos emocionais detalhados (alegria, medo/FOMO, nostalgia, pertencimento, gratificação)
- Combo Escassez + Prova Social
- Soft Sell vs Hard Sell (para blog: sempre soft sell)
- Conversion killers: hook fraco, push cedo demais, feature dumping
- Princípios psicológicos para texto: problema sentido, solução específica, prova social crível, urgência real
- Checklist de conversão pré-publicação

**references/frameworks-de-cta.md** (~150 linhas):
Compilação de coreyhaines/copywriting + anthropics/content-creation — apenas CTAs para blog:
- Fórmula: [Verbo de Ação] + [O que Recebem] + [Qualificador]
- CTAs por contexto de blog: fim de artigo, inline, sidebar
- Princípios: verbos de ação, específico sobre o próximo passo, reduzir risco
- Exemplos em pt-BR

**references/analise-de-headlines.md** (~150 linhas):
- Power words por categoria: urgência, curiosidade, especificidade, emoção, valor
- Scoring: 50-60 chars, keyword, power word, especificidade, match de intenção
- Geração de variações A/B: 3-5 alternativas por título
- Fórmulas traduzidas para pt-BR

### 3.11 `conhecimento-rag/SKILL.md`

**Fontes compiladas:**
- Instruções existentes de get*Instructions() das ferramentas RAG
- writer-agent.ts (INTERNAL LINKING section)

**SKILL.md** (~100 linhas):
- Quando usar RAG: encontrar conteúdo publicado para linking interno, verificar cobertura de tópico, manter consistência
- searchPreviousContentTool: busca por tópico, modo "links" para linking interno, modo "content" para referência
- graphSearchTool: busca por relacionamento, descobrir oportunidades de linking, mapear relações
- Boas práticas de linking interno: texto âncora contextual, 2-3 links por 1000 palavras, link de spoke para pillar, nunca "clique aqui"

### 3.12 `gestao-de-citacoes/SKILL.md`

**Fontes compiladas:**
- Pesquisa Princeton GEO (citações = +40% visibilidade, estatísticas = +37%, quotes = +30%)
- davila7/content-research-writer (citation management formats)
- Instruções existentes de citationTool

**SKILL.md** (~100 linhas):
- Por que citações importam: +40% visibilidade GEO, +37% com estatísticas, +30% com expert quotes
- Regras: toda estatística com fonte, todo quote com atribuição, todo claim com evidência
- Preferir fontes recentes (< 2 anos) e autoritativas
- Formatos: inline, numbered references, footnotes
- E-E-A-T através de citações: experiência, expertise, autoridade, confiança
- Exemplos em pt-BR

---

## 4. Mudanças em Internals

### 4.1 `utils.ts` — Substitui `shared.ts` + `helpers.ts`

```typescript
// src/utils.ts
import { ModelRouterEmbeddingModel } from "@mastra/core/llm";
import { PgVector } from "@mastra/pg";

// PgVector SEMPRE configurado — infraestrutura obrigatória
export const pgVectorStore = new PgVector({ ... });
export const embeddingModel = new ModelRouterEmbeddingModel({ ... });

export function buildLanguageInstruction(language: string): string { ... }
export function compileInstructionMemories(memories: InstructionMemory[]): string { ... }
```

### 4.2 RAG — Funções puras, Zod schemas

```typescript
// src/rag/schemas.ts (Zod-first, sem types.ts)
export const ragSearchInputSchema = z.object({ ... });
export type RagSearchInput = z.infer<typeof ragSearchInputSchema>;

// src/rag/rag-service.ts (funções puras)
export async function searchSimilarContent(input: RagSearchInput) { ... }
export async function indexContent(input: RagIndexContent) { ... }
```

### 4.3 Tools — Remover get*Instructions()

Cada arquivo de tool se torna definição pura. As instruções migram para as skills.

```typescript
// tools/analysis/seo-score-tool.ts
export const seoScoreTool = createTool({ ... });
// get*Instructions() REMOVIDO — conteúdo migrou para skills/otimizacao-seo/
```

### 4.4 Workspace + Mastra

```typescript
// src/workspace.ts
export const workspace = new Workspace({
  filesystem: new LocalFilesystem({ basePath }),
  skills: ["/src/skills"],
  bm25: true,
});

// src/mastra.ts
export const mastra = new Mastra({
  agents: { orchestratorAgent, fimAgent, inlineEditAgent },
  vectors: { pgVector: pgVectorStore },
  workspace,
});
```

---

## 5. Package Exports

```json
{
  "name": "@packages/agents",
  "exports": {
    "./mastra": {
      "default": "./src/mastra.ts",
      "types": "./dist/src/mastra.d.ts"
    },
    "./models": {
      "default": "./src/models.ts",
      "types": "./dist/src/models.d.ts"
    },
    "./rag/*": {
      "default": "./src/rag/*.ts",
      "types": "./dist/src/rag/*.d.ts"
    }
  }
}
```

Consumidores:
- `apps/web` importa `@packages/agents/mastra` para acessar `mastra.getAgent("orchestrator-agent")`
- `apps/web` importa `@packages/agents/models` para lista frontend-safe
- Scripts de reindex importam `@packages/agents/rag/content-indexer`

---

## 6. Plano de Migração

### Fase 1: Criar estrutura de skills (sem mudar agentes)
1. Criar diretório `src/skills/` com todas as 12 skills
2. Escrever todos os SKILL.md e references/
3. Testar que Workspace descobre as skills

### Fase 2: Refatorar internals
4. Criar `utils.ts` (substituir shared.ts + helpers.ts)
5. Refatorar RAG para funções puras + Zod schemas
6. Remover get*Instructions() de todos os tools

### Fase 3: Criar sub-agentes + orchestrator
7. Criar planner-agent.ts, researcher-agent.ts, seo-auditor-agent.ts, reviewer-agent.ts
8. Refatorar writer-agent.ts (remover instruções hardcoded, usar skills)
9. Criar orchestrator-agent.ts com sub-agentes
10. Criar workspace.ts e atualizar mastra.ts

### Fase 4: Atualizar consumidores
11. Atualizar apps/web para usar orchestrator ao invés de writer direto
12. Atualizar package.json exports
13. Atualizar scripts de reindex

### Fase 5: Limpeza
14. Remover shared.ts, helpers.ts
15. Remover types.ts files (usar z.infer)
16. Remover barrel files se existirem
