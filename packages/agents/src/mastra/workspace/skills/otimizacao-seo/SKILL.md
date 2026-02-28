---
name: otimizacao-seo
description: Diretrizes completas de SEO on-page para posts de blog, com prioridade de auditoria, checklist, pontuação e validações finais.
---

# Otimização de SEO (On-Page) — Posts de Blog

> Objetivo: garantir que cada post de blog atinja padrões consistentes de SEO on-page, com foco em intenção de busca, legibilidade e sinais de qualidade.

## Ordem de prioridade na auditoria

1. **Título**
2. **Meta description**
3. **Headings (H2/H3)**
4. **Keywords**
5. **Comprimento do texto**
6. **Resposta rápida (Quick Answer)**
7. **Links internos e externos**
8. **Imagens e alt text**

> ✅ Sempre corrigir itens de maior prioridade antes de ajustes finos.

## Checklist de SEO on-page (posts de blog)

### Título
- [ ] 50–60 caracteres (ideal 55)
- [ ] Palavra-chave principal no início
- [ ] Único e específico (sem duplicidade)
- [ ] Promessa clara de valor
- [ ] Evitar clickbait vazio

✅ **Exemplo bom:**
> “Guia de SEO para Blogs: Checklist Completo em 2026”

❌ **Exemplo ruim:**
> “Tudo Sobre SEO”

### Meta description
- [ ] 150–160 caracteres
- [ ] Palavra-chave principal + proposta de valor
- [ ] Texto natural e persuasivo
- [ ] Evitar repetição do título

✅ **Exemplo bom:**
> “Aprenda a otimizar posts de blog com um checklist de SEO atualizado, incluindo título, headings, links e imagens.”

❌ **Exemplo ruim:**
> “SEO para blog. SEO para blog. SEO para blog.”

### Headings
- [ ] Não usar H1 no corpo (somente no frontmatter)
- [ ] H2 a cada 200–300 palavras
- [ ] H3 para detalhamento lógico
- [ ] Palavra-chave ou variações em alguns H2

✅ **Exemplo bom:**
> H2: “Como definir palavras‑chave para posts de blog”

❌ **Exemplo ruim:**
> H1: “Introdução” (dentro do corpo)

### Keywords
- [ ] Densidade de 1–2% para a palavra‑chave principal
- [ ] Sem keyword stuffing
- [ ] Palavra‑chave no primeiro parágrafo
- [ ] Distribuição natural ao longo do texto

✅ **Exemplo bom:**
> “Este guia de SEO para blogs mostra…”

❌ **Exemplo ruim:**
> “SEO para blogs é SEO para blogs porque SEO para blogs…”

### Comprimento
- [ ] Mínimo recomendado: 1000+ palavras
- [ ] Conteúdo aprofundado e útil
- [ ] Evitar parágrafos inflados

### Resposta rápida (Quick Answer)
- [ ] TL;DR, definição ou resposta direta nos primeiros 100 palavras
- [ ] Frase curta e objetiva

✅ **Exemplo bom:**
> “SEO para blogs é o conjunto de práticas on-page que melhora o ranqueamento e a experiência do leitor.”

### Links
- [ ] 2–4 links internos por 1000 palavras
- [ ] 1–2 links externos por 1000 palavras
- [ ] Âncoras descritivas
- [ ] Fontes confiáveis

### Imagens
- [ ] 1 imagem a cada 300–500 palavras
- [ ] Alt text descritivo e relevante
- [ ] Evitar imagens genéricas repetidas

## Regras essenciais (resumo)

- **Título:** 50–60 caracteres; keyword no início.
- **Meta:** 150–160 caracteres; keyword + proposta de valor.
- **Keywords:** densidade 1–2%; nunca stuffing.
- **Headings:** sem H1 no corpo; H2 a cada 200–300 palavras.

## Validação pós‑escrita (obrigatória)

Após finalizar o post, chame:

- **`analyzeContent`** — score SEO geral, identifica o que corrigir
- **`injectKeywords`** — inserir keywords faltantes mantendo naturalidade
- **`addInternalLinks`** — links internos (use `searchPreviousContent` primeiro para encontrar conteúdo relevante)
- **`addExternalLinks`** — links externos para fontes citadas na pesquisa
- **`generateQuickAnswer`** — criar resposta rápida nos primeiros 100 palavras
- **`editTitle`** — corrigir título se necessário
- **`editDescription`** — corrigir meta description se necessário

✅ **Meta mínima:** score `analyzeContent` ≥ 80 pontos antes de finalizar.

## Visão geral da pontuação de SEO

Peso total: **100 pontos**

- Título: **15 pts**
- Meta description: **10 pts**
- Headings: **15 pts**
- Comprimento: **10 pts**
- Keywords: **15 pts**
- Links: **10 pts**
- Quick Answer: **10 pts**
- Estrutura: **5 pts**
- Conclusão: **5 pts**
- Imagens: **5 pts**

✅ **Meta mínima recomendada:** 80 pontos.

## Ferramentas de análise (13)

1. `seoScore`
2. `readability`
3. `keywordDensity`
4. `contentStructure`
5. `badPattern`
6. `titleMeta`
7. `quickAnswerAnalysis`
8. `imageSeo`
9. `linkDensity`
10. `duplicateContent`
11. `toneAnalysis`
12. `citation`
13. `originality`

✅ **Use os resultados para priorizar correções conforme a ordem de auditoria.**

## Exemplos rápidos de boas práticas

✅ **Boa estrutura de introdução**
> “SEO para blogs é o conjunto de práticas on‑page que melhora o ranqueamento e a experiência do leitor. Neste guia, você verá um checklist completo e exemplos práticos.”

❌ **Introdução fraca**
> “Neste texto vamos falar sobre vários assuntos interessantes.”

✅ **Boa âncora de link interno**
> “Veja o **guia de pesquisa de palavras‑chave** para aprofundar.”

❌ **Âncora genérica**
> “Clique aqui.”

## Referências

- [Rubrica de pontuação](./references/rubrica-de-pontuacao.md)
- [Sinais E‑E‑A‑T](./references/sinais-eeat.md)
- [Checklist SEO completo](./references/checklist-seo-completo.md)

---

> ✅ Esta skill aplica‑se **somente a posts de blog**.
