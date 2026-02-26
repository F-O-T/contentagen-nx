---
name: conhecimento-rag
description: Use when precisar buscar conteúdo interno, criar links internos, ou explorar conexões temáticas com RAG em conteúdos já publicados.
---

# Conhecimento RAG

## Visão geral
Guia para usar ferramentas de RAG na busca de conteúdo interno, referência contextual e descoberta de relacionamentos entre temas.

## Quando usar
- Planejamento de conteúdo: descobrir tópicos relacionados e lacunas.
- Redação/edição: adicionar links internos relevantes.
- Revisão: garantir consistência com conteúdos já publicados.

## Ferramentas

### searchPreviousContent
Busca conteúdo já publicado.

**Modos:**
- `links`: títulos/slug para linkagem interna.
- `context`: trechos para referência/consistência.
- `both`: visão completa (links + contexto), útil no planejamento.

**Quando escolher cada modo**
- Use `links` ao inserir links internos no texto.
- Use `context` para alinhar tom, terminologia e fatos.
- Use `both` na fase de planejamento ou quando precisa de visão ampla.

**Relevância:** scores acima de 70% indicam alta aderência ao tema.

**Exemplo (linkagem):**
```ts
await searchPreviousContent({ query: "marketing de conteúdo", mode: "links" });
```

### graphSearch
Busca por conexões indiretas via grafo de relacionamento.

**Parâmetros principais:**
- `depth` entre 1 e 3 (padrão 2).

**Quando usar**
- Explorar conexões indiretas entre temas.
- Encontrar oportunidades de conteúdo (gaps).
- Montar clusters (spoke-to-pillar).

**Relevância:** maior score = conexão mais forte.

## Regras de linkagem interna
- **Âncora contextual**: use termos do assunto, não frases genéricas.
- **2–3 links por 1000 palavras** (evite excesso).
- **Spoke-to-pillar**: artigos específicos apontam para pilares.
- **Nunca** use “clique aqui”.

## Exemplos ✅ / ❌

**❌ Ruim (âncora genérica):**
> Para mais informações, **clique aqui**.

**✅ Bom (âncora contextual):**
> Veja nosso guia de **estratégia de conteúdo**: [Estratégia de Conteúdo](/blog/estrategia-de-conteudo).

**❌ Ruim (excesso de links):**
> [Link 1](/blog/a) [Link 2](/blog/b) [Link 3](/blog/c) [Link 4](/blog/d)

**✅ Bom (quantidade balanceada):**
> Para aprofundar, leia [SEO On-Page](/blog/seo-on-page) e [Pesquisa de Palavras-chave](/blog/pesquisa-de-palavras-chave).

## Fluxo recomendado
1. Planeje o tópico com `searchPreviousContent` em `both`.
2. Encontre conexões com `graphSearch` (depth 2).
3. Ao escrever, use `links` para inserir 2–3 links por 1000 palavras.
4. Revise com `context` para consistência.

## Erros comuns
- Usar `context` quando o objetivo é só linkar (prefira `links`).
- Inserir links sem relevância temática.
- Repetir a mesma âncora em múltiplos links.
- Exagerar na quantidade de links internos.
