---
name: gestao-de-citacoes
description: Use when writing or reviewing blog posts em pt-BR que incluem dados, estatísticas, citações, números, estudos, afirmações ou “segundo especialistas” e precisam de gestão de fontes e evidências.
---

# Gestão de Citações (pt-BR)

## Visão geral
Citações aumentam a visibilidade em buscas com IA e sustentam E-E-A-T. Dados Princeton GEO mostram: estatísticas +37%, citações +40%, quotes de especialistas +30%.

## Por que importa
- **GEO/AI Search:** conteúdo com evidências aparece mais.
- **Credibilidade:** reduz risco de desinformação.
- **E-E-A-T:** demonstra experiência, especialização e confiabilidade.

## Regras obrigatórias
1. **Toda estatística precisa de fonte** (percentuais, números absolutos, métricas).
2. **Toda citação precisa de atribuição** (autor, cargo/entidade, data ou contexto).
3. **Toda afirmação factual/causal precisa de evidência** (“estudos mostram”, “pesquisas indicam”).
4. **Preferir fontes recentes (<= 2 anos)** e **autoridade** (instituições, papers, órgãos oficiais).
5. **URL deve ser de página específica** — não apenas domínio-raiz. `(tcu.gov.br)` ou `(gov.br)` sozinhos não são citações válidas; use a URL do relatório ou documento exato.
6. **Exemplos numéricos de eventos reais** (ex: “X empresas participaram, economia de Y%”) só podem ser incluídos se o dado exato foi encontrado via webSearch/factFinder e citado com URL da página-fonte.

## O que deve acionar citação
- “53% dos…”, “2 bilhões de usuários…”, “84% dos marketers…”
- “segundo especialistas…”, “estudos mostram…”, “pesquisas indicam…”
- Quotes atribuídas direta ou indiretamente
- Comparações e rankings (“o melhor”, “o maior”, “o mais usado”)

## Formatos aceitos
**Inline parentético:** `segundo [Fonte] ([url-específica-ou-ano])`

**Inline link:** `[texto](url-específica)`

**Atribuição direta:** `”Fonte: …”` / `”Segundo …”`

> **Proibido:** `[1]`, `[^1]` e seções “Referências:” — use apenas citações inline.

## Padrão de evidência (E-E-A-T)
- **Quem disse?** (autor ou instituição)
- **Quando?** (data da publicação)
- **Onde?** (link ou referência)
- **O que comprova?** (qual afirmação sustenta)

## Fluxo mínimo de pesquisa
1. Identifique estatísticas/quotes/claims no texto.
2. Encontre a melhor fonte possível (recente e autoritativa).
3. Aplique o formato de citação adequado.
4. Revise se cada claim ficou “comprovável”.

## Exemplos (❌/✅)
❌ “84% dos marketers usam IA.”
✅ “84% dos marketers usam IA (HubSpot, hubspot.com/state-of-marketing-2024).”

❌ “Estudos mostram que o SEO melhora conversões.”
✅ “Estudos da HubSpot (hubspot.com/marketing-statistics) mostram que o SEO melhora conversões.”

❌ “Segundo especialistas, o tráfego orgânico é o canal mais confiável.”
✅ “Segundo a Moz (moz.com/learn/seo/organic-traffic-2023), o tráfego orgânico é o canal mais confiável.”

❌ “2 bilhões de usuários ativos.”
✅ “2 bilhões de usuários ativos (Meta, about.fb.com/news/2024/...).”

❌ “Em 2024, um pregão no DF atraiu 50 empresas com economia de 20% (pncp.gov.br).”
✅ Omita — dado específico não encontrado via ferramenta com URL de página exata. Use: “conforme registros do PNCP (pncp.gov.br/busca).”

## Qualidade de fontes
**Preferir:** papers, relatórios oficiais, institutos, universidades, órgãos públicos, líderes de mercado.

**Evitar:** blogs sem autoria, dados sem metodologia, posts desatualizados.

## Checklist rápido
- [ ] Todo número tem fonte
- [ ] Toda quote tem atribuição
- [ ] Toda claim tem evidência
- [ ] Fonte é recente e confiável
- [ ] Formato de citação consistente

## Integração com ferramentas de citação
- O verificador gera **score 0–100**, **uncitedCount** e **sugestões**.
- Use as queries sugeridas para encontrar fontes melhores.

## Erros comuns
- Usar “segundo especialistas” sem link ou nome.
- Citar fonte velha quando há atualização recente.
- Citar apenas no fim do texto e não na frase alvo.
- **Citar apenas o domínio-raiz** (`”gov.br”`, `”tcu.gov.br”`) sem especificar a página — unverificável.
- **Inventar exemplos ilustrativos com números específicos** (“Em 2024, um pregão atraiu 50 empresas...”) sem URL verificável da fonte exata.
- Usar `[1]` ou `[^n]` — formato proibido neste projeto; use inline apenas.

## Resultado esperado
Conteúdo comprovável, rastreável e com alto potencial de visibilidade em IA.
